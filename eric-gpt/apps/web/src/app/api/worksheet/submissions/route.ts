import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * API route for fetching worksheet submissions
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward request to backend server
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'API URL not configured' }, { status: 500 });
    }

    // Get pillar ID from query parameters if present
    const { searchParams } = new URL(request.url);
    const pillarId = searchParams.get('pillarId');
    
    // Construct URL with query parameters - use the correct endpoint /api/submissions
    const url = new URL(`${apiUrl}/api/submissions`);
    url.searchParams.append('userId', session.user.id);
    if (pillarId) url.searchParams.append('pillarId', pillarId);
    
    console.log('Web app: Forwarding worksheet submissions request to:', url.toString());

    // Forward to backend server
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch worksheet submissions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching worksheet submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
