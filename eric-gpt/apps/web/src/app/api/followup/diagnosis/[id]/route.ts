import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Proxy route that forwards follow-up diagnosis requests to the server app
 * @param request The request object
 * @param params The route parameters containing the follow-up ID
 * @returns The follow-up diagnosis data from the server
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the follow-up ID from the route params
    const { id: followupId } = await params;
    
    if (!followupId) {
      return NextResponse.json({ error: 'Follow-up ID is required' }, { status: 400 });
    }
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Forward the request to the server app
    console.log(`Proxying diagnosis request for follow-up ID: ${followupId}`);
    
    // Get the server URL from environment variables or use default
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log(`Web app: Forwarding to server URL: ${serverUrl}`);
    
    // Forward the request with the session data and a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Extract user ID and other session data for authorization
      const userId = session.user.id;
      
      const serverResponse = await fetch(`${serverUrl}/api/followup/diagnosis/${followupId}`, {
        headers: {
          'Content-Type': 'application/json',
          // Pass user ID as a custom authorization header
          'X-User-Id': userId,
          // Add additional session data for verification
          'X-Session-User-Email': session.user.email || '',
          'X-Session-User-Name': session.user.name || '',
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
          { error: data.error || 'Error fetching diagnosis from server' }, 
          { status: serverResponse.status }
        );
      }
      
      return NextResponse.json(data);
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      console.log(`Error fetching diagnosis for follow-up ID: ${followupId}`, error);
      return NextResponse.json({ 
        error: 'Failed to fetch follow-up diagnosis', 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in diagnosis proxy route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
