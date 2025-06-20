import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Proxy endpoint to forward individual tracker GET requests to the server API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Access id from params - in Next.js 15, params must be awaited
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Tracker ID is required' },
        { status: 400 }
      );
    }

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const userId = session.user.id;
    
    // Add userId as a query parameter
    const response = await fetch(`${serverUrl}/api/trackers/${id}?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error details if possible
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData;
      } catch (e) {
        // Ignore error in getting error details
      }
      
      return NextResponse.json(
        { error: `Server returned error: ${response.status}`, details: errorDetails },
        { status: response.status }
      );
    }

    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json(
        { error: 'Failed to parse server response' },
        { status: 500 }
      );
    }

    // Return the response from the server
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in tracker proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch tracker', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Proxy endpoint to forward individual tracker PUT requests to the server API
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Access id from params - in Next.js 15, params must be awaited
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Tracker ID is required' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const userId = session.user.id;
    
    // Add userId as a query parameter
    const response = await fetch(`${serverUrl}/api/trackers/${id}?userId=${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error details if possible
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData;
      } catch (e) {
        // Ignore error in getting error details
      }
      
      return NextResponse.json(
        { error: `Server returned error: ${response.status}`, details: errorDetails },
        { status: response.status }
      );
    }

    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json(
        { error: 'Failed to parse server response' },
        { status: 500 }
      );
    }

    // Return the response from the server
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in tracker proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update tracker', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Proxy endpoint to forward individual tracker DELETE requests to the server API
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Access id from params - in Next.js 15, params must be awaited
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Tracker ID is required' },
        { status: 400 }
      );
    }

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const userId = session.user.id;
    
    // Add userId as a query parameter
    const response = await fetch(`${serverUrl}/api/trackers/${id}?userId=${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error details if possible
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData;
      } catch (e) {
        // Ignore error in getting error details
      }
      
      return NextResponse.json(
        { error: `Server returned error: ${response.status}`, details: errorDetails },
        { status: response.status }
      );
    }

    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json(
        { error: 'Failed to parse server response' },
        { status: 500 }
      );
    }

    // Return the response from the server
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in tracker proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete tracker', message: errorMessage },
      { status: 500 }
    );
  }
}
