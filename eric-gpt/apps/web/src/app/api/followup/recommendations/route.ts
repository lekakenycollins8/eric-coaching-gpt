import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * API route for fetching follow-up recommendations
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
    console.log('Web app: Forwarding to server URL:', serverUrl);
    
    // Add the user ID to the query parameters
    const userId = session.user.id;
    
    // Construct URL with query parameters
    const apiUrl = `${serverUrl}/api/followup/recommendations?userId=${userId}`;
    console.log('Web app: Forwarding request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
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
    console.error('Error in recommendations proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch follow-up recommendations', message: errorMessage },
      { status: 500 }
    );
  }
}
