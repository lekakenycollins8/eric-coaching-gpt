import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * API route for follow-up submission and retrieval
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log('Web app: Forwarding to server URL:', serverUrl);
    
    // Add the user ID to the body
    const userId = session.user.id;
    const bodyWithUserId = { ...body, userId };
    
    const response = await fetch(`${serverUrl}/api/followup`, {
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
    console.error('Error in followup proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to submit follow-up', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * API route for getting a follow-up worksheet based on a previous submission
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const submissionId = searchParams.get('submissionId');
    const queryString = searchParams.toString();
    
    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log('Web app: Forwarding to server URL:', serverUrl);
    
    // Add the user ID to the query parameters
    const userId = session.user.id;
    
    // Construct URL with query parameters
    const apiUrl = `${serverUrl}/api/followup?submissionId=${submissionId}&userId=${userId}`;
    console.log('Web app: Forwarding request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    console.error('Error in followup proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get follow-up worksheet', message: errorMessage },
      { status: 500 }
    );
  }
}
