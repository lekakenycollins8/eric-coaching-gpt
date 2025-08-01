import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * API route for submitting follow-up assessments
 * Proxies requests to the server 
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log('Web app: Forwarding to server URL:', serverUrl);
    
    // Add the user ID to the body and headers
    const userId = session.user.id;
    const bodyWithUserId = { ...body, userId };
    
    const response = await fetch(`${serverUrl}/api/followup/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass user ID as a custom authorization header
        'X-User-Id': userId,
        // Add additional session data for verification
        'X-Session-User-Email': session.user.email || '',
        'X-Session-User-Name': session.user.name || '',
        // Include cookies for local development compatibility
        'Cookie': req.headers.get('cookie') || '',
      },
      body: JSON.stringify(bodyWithUserId),
      credentials: 'include',
    });

    // Check if the response is valid JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response received from server:', await response.text());
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      );
    }
    
    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server returned an error:', response.status, errorData);
      return NextResponse.json(
        { error: errorData.message || `Server error: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the response data
    const data = await response.json();

    // Return the response from the server
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in followup submit proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to submit follow-up', message: errorMessage },
      { status: 500 }
    );
  }
}
