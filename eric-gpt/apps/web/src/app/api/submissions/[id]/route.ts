import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Proxy API route to forward GET requests for a single submission to the server application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Await the params Promise in Next.js 15
    const resolvedParams = await params;
    const submissionId = resolvedParams.id;
    
    // Forward the request to the server application
    const SERVER_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log(`Forwarding GET request to server: ${SERVER_API_URL}/api/submissions/${submissionId}?userId=${session.user.id}`);
    
    try {
      const response = await fetch(
        `${SERVER_API_URL}/api/submissions/${submissionId}?userId=${session.user.id}`
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
    console.error('Error proxying submission GET request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission', message: error.message },
      { status: 500 }
    );
  }
}