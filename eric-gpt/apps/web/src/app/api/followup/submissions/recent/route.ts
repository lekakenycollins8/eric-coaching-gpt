/**
 * API route to get the most recent follow-up submission for the current user
 * Used to determine the appropriate diagnosis page to show
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET handler to retrieve the most recent follow-up submission
 */
export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const targetEndpoint = `${serverUrl}/api/followup/submissions/recent`;
    
    console.log(`Fetching most recent follow-up submission from: ${targetEndpoint}`);
    
    // Forward the request with the session cookie and a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Forward the request with the session cookie
      const serverResponse = await fetch(targetEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          // Pass along the cookie which contains the session information
          'Cookie': request.headers.get('cookie') || '',
          'X-User-Id': session.user?.id || ''
        },
        signal: controller.signal,
        credentials: 'include',
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      if (!serverResponse.ok) {
        const errorText = await serverResponse.text();
        console.error(`Error fetching recent submission: ${serverResponse.status}`, errorText);
        return NextResponse.json(
          { error: 'Failed to fetch recent submission' }, 
          { status: serverResponse.status }
        );
      }
      
      // Return the server response
      const data = await serverResponse.json();
      return NextResponse.json(data);
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      console.error('Error in recent submissions proxy route:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch recent follow-up submission', 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in recent submission API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
