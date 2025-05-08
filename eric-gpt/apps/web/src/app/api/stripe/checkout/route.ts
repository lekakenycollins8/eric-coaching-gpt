import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

/**
 * API route for creating a Stripe checkout session
 * This is a proxy that forwards the request to the server application
 */
export async function POST(request: Request) {
  try {
    console.log('Web app: Received checkout request');
    
    // Verify the user is authenticated
    const session = await getServerSession(authOptions);
    console.log('Web app: User session:', !!session?.user);
    
    if (!session?.user) {
      console.error('Web app: Unauthorized - no user session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    console.log('Web app: Request body:', JSON.stringify(body, null, 2));

    // Forward the request to the server application
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log('Web app: Forwarding to server URL:', serverUrl);
    
    const serverEndpoint = `${serverUrl}/api/stripe/create-checkout-session`;
    console.log('Web app: Full server endpoint:', serverEndpoint);
    const response = await fetch(serverEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Return the response from the server
    console.log('Web app: Server response status:', response.status);
    
    const data = await response.json();
    console.log('Web app: Server response data:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Web app: Error creating checkout session:', error);
    console.error('Web app: Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
