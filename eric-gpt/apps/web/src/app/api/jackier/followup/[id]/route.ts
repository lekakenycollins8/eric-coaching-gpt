import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Proxy endpoint to forward Jackier followup worksheet by ID requests to the server API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Worksheet ID is required' },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const queryPart = queryString ? `?${queryString}` : '';

    // Forward the request to the server API
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Add the user ID and worksheetId to the query parameters
    const userId = session.user.id;
    // The server API expects worksheetId as a query parameter, not in the path
    const worksheetIdParam = `worksheetId=${id}`;
    const baseQueryString = queryString ? `${queryString}&${worksheetIdParam}` : worksheetIdParam;
    const userQueryParam = `&userId=${userId}`;
    
    const apiUrl = `${serverUrl}/api/followup?${baseQueryString}${userQueryParam}`;
    console.log('Web app: Forwarding request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
      console.error('Server returned an error:', response.status, errorData);
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
    console.error('Error in followup by ID API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
