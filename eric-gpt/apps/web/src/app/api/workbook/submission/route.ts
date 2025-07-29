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

    // Get the user ID from the session
    const userId = session.user.id;
    
    // Parse the request URL to get query parameters
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    
    // Construct the backend URL with appropriate query parameters
    let backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/workbook/submission?userId=${userId}`;
    
    // Add submissionId parameter if provided
    if (submissionId) {
      backendUrl += `&submissionId=${submissionId}`;
    }
    
    // Make the request to the backend
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch workbook submission' },
        { status: response.status }
      );
    }

    // Return the JSON data
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in workbook submission proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
