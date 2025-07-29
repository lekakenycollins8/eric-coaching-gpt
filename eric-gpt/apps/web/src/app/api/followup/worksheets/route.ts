import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Proxy route for /api/followup/worksheets
 * Forwards requests to the server API
 */
export async function GET(request: Request) {
  try {
    // Get the authenticated user from session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the URL and query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    // Create the server URL with proper query parameters
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const apiUrl = new URL(`${serverUrl}/api/followup/worksheets`);
    if (type) {
      apiUrl.searchParams.append('type', type);
    }
    // Add userId as a query parameter for server-side authentication
    apiUrl.searchParams.append('userId', session.user.id);

    console.log(`Web app: Forwarding request to: ${apiUrl.toString()}`);

    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Forward the request to the server
      const serverResponse = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-From': 'web-app',
        },
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Clear the timeout if the request completes

      if (!serverResponse.ok) {
        console.error(`Server error: ${serverResponse.status} ${serverResponse.statusText}`);
        const errorText = await serverResponse.text();
        console.error(`Error details: ${errorText}`);
        return NextResponse.json(
          { error: `Server error: ${serverResponse.status}` },
          { status: serverResponse.status }
        );
      }

      // Return the server response
      const data = await serverResponse.json();
      return NextResponse.json(data);
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timed out');
        return NextResponse.json(
          { error: 'Request timed out' },
          { status: 504 }
        );
      }
      throw error; // Re-throw for the outer catch block
    }
  } catch (error: unknown) {
    console.error('Error in worksheets proxy route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
