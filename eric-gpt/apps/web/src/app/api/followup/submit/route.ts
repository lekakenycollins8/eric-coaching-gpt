import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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
    
    // Add the user ID to the body
    const userId = session.user.id;
    const bodyWithUserId = { ...body, userId };
    
    const response = await fetch(`${serverUrl}/api/followup/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyWithUserId),
    });

    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error('Server returned an error:', response.status, errorText);
      return NextResponse.json(
        { error: `Server error: ${response.status}`, message: 'The server API returned an error' },
        { status: response.status }
      );
    }

    // Get the response data
    const data = await response.json().catch(error => {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Invalid JSON response from server');
    });

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
