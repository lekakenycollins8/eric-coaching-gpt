import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * API route for fetching workbook submission
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      console.error('NEXT_PUBLIC_API_URL is not defined');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // Construct URL with query parameters
    const url = new URL(`${apiUrl}/api/workbook/submission`);
    url.searchParams.append('userId', session.user.id);
    
    console.log('Web app: Forwarding workbook submission request to:', url.toString());

    // Forward to backend server
    const response = await fetch(url.toString(), {
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

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in workbook submission API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workbook submission' },
      { status: 500 }
    );
  }
}
