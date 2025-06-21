import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Proxy endpoint to forward tracker requests to the server API
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
    const queryString = searchParams.toString();
    const queryPart = queryString ? `?${queryString}` : '';

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log('Web app: Forwarding to server URL:', serverUrl);
    
    // Add the user ID to the query parameters
    const userId = session.user.id;
    const userQueryParam = queryString ? `&userId=${userId}` : `?userId=${userId}`;
    
    const apiUrl = `${serverUrl}/api/trackers${queryPart}${userQueryParam}`;
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
    console.error('Error in trackers proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch trackers', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Proxy endpoint to forward tracker creation requests to the server API
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

    // Get the request body
    const body = await request.json();

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log('Web app: Forwarding to server URL:', serverUrl);
    
    // Add the user ID to the body
    const userId = session.user.id;
    const bodyWithUserId = { ...body, userId };
    
    const response = await fetch(`${serverUrl}/api/trackers`, {
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
    console.error('Error in trackers proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create tracker', message: errorMessage },
      { status: 500 }
    );
  }
}
