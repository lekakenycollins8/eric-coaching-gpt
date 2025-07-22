import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Proxy API route to forward worksheet recommendation requests to the server application
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session to forward auth information
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('Web app: Forwarding worksheet recommendations request to server');
    
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const worksheetId = searchParams.get('worksheetId');
    const limit = searchParams.get('limit') || '5';
    
    // Build query string
    let queryString = '';
    if (worksheetId) {
      queryString += `worksheetId=${worksheetId}&`;
    }
    if (limit) {
      queryString += `limit=${limit}&`;
    }
    
    // Remove trailing ampersand if present
    if (queryString.endsWith('&')) {
      queryString = queryString.slice(0, -1);
    }
    
    // Forward the request to the server application
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${serverUrl}/api/worksheets/recommendations${queryString ? `?${queryString}` : ''}`;
    
    console.log('Web app: Sending request to:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        // Forward the session information
        'Authorization': `Bearer ${(session as any).accessToken || ''}`,
        'x-user-id': session.user.id || '',
        'x-user-email': session.user.email || ''
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error('Server returned an error:', response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      } else if (response.status === 403) {
        return NextResponse.json(
          { error: 'Subscription required for worksheet recommendations' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: `Server error: ${response.status}`, message: errorText },
        { status: response.status }
      );
    }
    
    // Check content type to avoid parsing non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Non-JSON response received:', responseText);
      return NextResponse.json(
        { error: 'Invalid response format from server' },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying worksheet recommendations request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worksheet recommendations from server' },
      { status: 500 }
    );
  }
}
