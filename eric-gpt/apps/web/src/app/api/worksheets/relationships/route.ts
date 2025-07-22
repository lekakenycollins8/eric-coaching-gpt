import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Proxy API route to forward worksheet relationship requests to the server application
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
    
    console.log('Web app: Forwarding worksheet relationships request to server');
    
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const worksheetId = searchParams.get('worksheetId');
    const direction = searchParams.get('direction') || 'from';
    
    if (!worksheetId) {
      return NextResponse.json(
        { error: 'Worksheet ID is required' },
        { status: 400 }
      );
    }
    
    // Forward the request to the server application
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${serverUrl}/api/worksheets/relationships?worksheetId=${worksheetId}&direction=${direction}`;
    
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
          { error: 'Subscription required for worksheet relationships' },
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
    console.error('Error proxying worksheet relationships request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worksheet relationships from server' },
      { status: 500 }
    );
  }
}

/**
 * Proxy API route to forward POST requests for creating worksheet relationships
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session to forward auth information
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('Web app: Forwarding worksheet relationship creation request to server');
    
    // Get the request body
    const body = await request.json();
    
    // Forward the request to the server application
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${serverUrl}/api/worksheets/relationships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the session information
        'Authorization': `Bearer ${(session as any).accessToken || ''}`,
        'x-user-id': session.user.id || '',
        'x-user-email': session.user.email || ''
      },
      body: JSON.stringify(body),
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
          { error: 'Subscription required for creating worksheet relationships' },
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
    console.error('Error proxying worksheet relationship creation request:', error);
    return NextResponse.json(
      { error: 'Failed to create worksheet relationship' },
      { status: 500 }
    );
  }
}
