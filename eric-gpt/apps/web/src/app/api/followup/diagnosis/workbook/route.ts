import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Proxy route that forwards workbook follow-up diagnosis requests to the server app
 * @param request The request object
 * @returns The workbook follow-up diagnosis data from the server
 */
export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Forward the request to the server app
    console.log('Proxying workbook diagnosis request');
    
    // Get the server URL from environment variables or use default
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log(`Web app: Forwarding to server URL: ${serverUrl}`);
    
    // Forward the request with the session data and a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Extract user ID from session for authorization
      const userId = session.user.id;
      
      const serverResponse = await fetch(`${serverUrl}/api/followup/diagnosis/workbook`, {
        headers: {
          'Content-Type': 'application/json',
          // Pass user ID as a custom authorization header
          'X-User-Id': userId,
          // Still include cookies for local development compatibility
          'Cookie': request.headers.get('cookie') || '',
        },
        signal: controller.signal,
        credentials: 'include',
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Return the server response
      const data = await serverResponse.json();
      
      if (!serverResponse.ok) {
        return NextResponse.json(
          { error: data.error || 'Error fetching workbook diagnosis from server' }, 
          { status: serverResponse.status }
        );
      }
      
      return NextResponse.json(data);
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      console.error('Error in workbook diagnosis proxy route:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch workbook follow-up diagnosis', 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in workbook diagnosis route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
