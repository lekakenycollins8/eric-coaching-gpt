import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Proxy endpoint to mark a diagnosis as viewed
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

    // Parse the request body
    const body = await request.json().catch(() => ({}));
    
    // Add the user ID to the body
    const bodyWithUser = {
      ...body,
      userId: session.user.id
    };

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // Based on server API structure, the correct endpoint is /api/diagnosis with POST method
    const apiUrl = `${serverUrl}/api/diagnosis`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyWithUser),
    });

    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      // Handle non-JSON responses (like HTML error pages)
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error('Server returned a non-JSON response:', response.status, contentType, errorText.substring(0, 200));
        return NextResponse.json(
          { error: `Server error: ${response.status}`, message: 'The server API returned a non-JSON response' },
          { status: response.status }
        );
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Could not parse error response' }));
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
    console.error('Error in diagnosis view API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
