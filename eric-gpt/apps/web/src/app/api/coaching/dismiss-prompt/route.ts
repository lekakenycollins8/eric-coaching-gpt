import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * API route to track when a user dismisses a coaching prompt
 * This allows us to avoid showing the same prompt repeatedly
 * This is a proxy endpoint that forwards requests to the server API
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 });
    }

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log('Web app: Forwarding coaching prompt dismissal request to server');
    
    // Add user information to the request body
    const requestBody = {
      userId: session.user.id,
      submissionId
    };
    
    const response = await fetch(`${serverUrl}/api/coaching/dismiss-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      // Get content type to handle non-JSON responses
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || 'Failed to record coaching prompt dismissal' }, 
          { status: response.status }
        );
      } else {
        // Handle non-JSON error response
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error('Server returned a non-JSON error:', response.status, errorText);
        return NextResponse.json(
          { error: `Server error: ${response.status}`, message: 'The server API returned an error' },
          { status: response.status }
        );
      }
    }

    // Get the response data
    const data = await response.json().catch(error => {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Invalid JSON response from server');
    });

    // Return the response from the server
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in coaching prompt dismissal proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to record coaching prompt dismissal', message: errorMessage },
      { status: 500 }
    );
  }
}
