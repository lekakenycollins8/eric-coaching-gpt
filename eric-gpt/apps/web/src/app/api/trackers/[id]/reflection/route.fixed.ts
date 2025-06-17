import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

/**
 * Proxy endpoint to forward tracker reflection GET requests to the server API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id?: string } }
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
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tracker ID is required' },
        { status: 400 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${serverUrl}/api/trackers/${id}/reflection?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error details if possible
      let errorData;
      try {
        const errorText = await response.text();
        try {
          // Try to parse as JSON
          errorData = JSON.parse(errorText);
        } catch {
          // If not valid JSON, use as plain text
          errorData = { message: errorText };
        }
      } catch (e) {
        // Ignore error in getting error details
        errorData = { message: 'Unknown error' };
      }
      
      return NextResponse.json(
        { 
          error: `Server returned error: ${response.status}`, 
          message: errorData?.error || errorData?.message || 'Unknown error' 
        },
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
    console.error('Error in tracker reflection proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch tracker reflection', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Proxy endpoint to forward tracker reflection POST requests to the server API
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id?: string } }
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
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tracker ID is required' },
        { status: 400 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;

    // Get the request body
    const body = await request.json();

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${serverUrl}/api/trackers/${id}/reflection?userId=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error details if possible
      let errorData;
      try {
        const errorText = await response.text();
        try {
          // Try to parse as JSON
          errorData = JSON.parse(errorText);
        } catch {
          // If not valid JSON, use as plain text
          errorData = { message: errorText };
        }
      } catch (e) {
        // Ignore error in getting error details
        errorData = { message: 'Unknown error' };
      }
      
      // Special handling for subscription errors
      if (response.status === 403 && errorData && errorData.error === 'Subscription required') {
        console.log('[DEBUG] Subscription required error detected for reflection');
        return NextResponse.json(
          { error: 'Subscription required', message: 'An active subscription is required to update tracker reflections.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `Server returned error: ${response.status}`, 
          message: errorData?.error || errorData?.message || 'Unknown error' 
        },
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
    console.error('Error in tracker reflection proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update tracker reflection', message: errorMessage },
      { status: 500 }
    );
  }
}
