import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Proxy API route to forward submission requests to the server application
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const body = await request.json();
    
    // Add the user ID to the request body instead of using Authorization header
    const userId = session.user.id;
    console.log(`[DEBUG] web/api/submissions/route.ts - User ID from session: ${userId}`);
    
    const enrichedBody = {
      ...body,
      userId // Include user ID in the request body
    };
    
    console.log(`[DEBUG] web/api/submissions/route.ts - User object from session:`, JSON.stringify(session.user, null, 2));
    
    // Forward the request to the server application
    const SERVER_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log(`Forwarding submission to server: ${SERVER_API_URL}/api/submissions`);
    console.log('Request body:', JSON.stringify(enrichedBody));
    
    try {
      const response = await fetch(`${SERVER_API_URL}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enrichedBody),
    });
    
    let data;
    
    try {
      // Try to parse the response as JSON
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.error('Server returned non-JSON response:', text);
        return NextResponse.json(
          { error: 'Server error', message: 'The server returned an invalid response' },
          { status: 500 }
        );
      }
      
      if (!response.ok) {
        // Handle error responses
        return NextResponse.json(
          data,
          { status: response.status }
        );
      }
    } catch (parseError) {
      console.error('Error parsing server response:', parseError);
      return NextResponse.json(
        { error: 'Server error', message: 'Failed to parse server response' },
        { status: 500 }
      );
    }
    
    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
    } catch (fetchError) {
      console.error('Network error when contacting server:', fetchError);
      return NextResponse.json(
        { error: 'Server connection error', message: 'Unable to connect to the server. Please try again later.' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('Error proxying submission request:', error);
    return NextResponse.json(
      { error: 'Failed to process submission', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Proxy API route to forward GET requests for submissions to the server application
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10';
    const page = searchParams.get('page') || '1';
    
    // Forward the request to the server application with userId as query param
    const SERVER_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log(`Forwarding GET request to server: ${SERVER_API_URL}/api/submissions?limit=${limit}&page=${page}&userId=${session.user.id}`);
    
    try {
      const response = await fetch(
        `${SERVER_API_URL}/api/submissions?limit=${limit}&page=${page}&userId=${session.user.id}`
      );
    
    let data;
    
    try {
      // Try to parse the response as JSON
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.error('Server returned non-JSON response:', text);
        return NextResponse.json(
          { error: 'Server error', message: 'The server returned an invalid response' },
          { status: 500 }
        );
      }
      
      if (!response.ok) {
        // Handle error responses
        return NextResponse.json(
          data,
          { status: response.status }
        );
      }
    } catch (parseError) {
      console.error('Error parsing server response:', parseError);
      return NextResponse.json(
        { error: 'Server error', message: 'Failed to parse server response' },
        { status: 500 }
      );
    }
    
    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
    } catch (fetchError) {
      console.error('Network error when contacting server:', fetchError);
      return NextResponse.json(
        { error: 'Server connection error', message: 'Unable to connect to the server. Please try again later.' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('Error proxying submissions GET request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions', message: error.message },
      { status: 500 }
    );
  }
}
