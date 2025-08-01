import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Proxy endpoint to forward Jackier workbook status requests to the server API
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Add the user ID to the query parameters
    const userId = session.user.id;
    const apiUrl = `${serverUrl}/api/workbook/status?userId=${userId}`;
    
    console.log('Web app: Forwarding workbook status request to:', apiUrl);
    console.log('Web app: User ID from session:', userId);
    console.log('Web app: Session data available:', !!session);
    
    // Create a cookie string from the request headers
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Extract session data for authentication
    // We don't have direct access to the token, but we can use the user ID
    
    // Forward the request with cookies and session data
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader, // Forward cookies for session authentication
        'Authorization': `Bearer ${session.user.id}`, // Add authorization header as backup
        'X-User-Id': session.user.id, // Add custom header with user ID
        'X-Session-User-Email': session.user.email || '', // Add user email for additional verification
        'X-Session-User-Name': session.user.name || '', // Add user name for additional verification
      },
      cache: 'no-store', // Ensure fresh data
      credentials: 'include', // Include cookies in the request
    });

    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      const responseStatus = response.status;
      
      console.error('Server returned error status:', responseStatus);
      console.error('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
      
      // Handle non-JSON responses (like HTML error pages)
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error('Server returned a non-JSON response:', response.status, contentType, errorText.substring(0, 200));
        return NextResponse.json(
          { error: `Server error: ${responseStatus}`, message: 'The server API returned a non-JSON response' },
          { status: responseStatus }
        );
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Could not parse error response' }));
      console.error('Server returned an error:', responseStatus, errorData);
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    // Parse JSON response
    const data = await response.json().catch((error) => {
      console.error('Error parsing JSON response:', error);
      return { error: 'Failed to parse server response' };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in workbook status API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
