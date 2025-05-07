import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API route for handling Stripe webhooks
 * This is a proxy that forwards the webhook to the server application
 */
export async function POST(request: Request) {
  try {
    // Get the request body as text to preserve the raw body for signature verification
    const body = await request.text();
    
    // Get all headers to forward them to the server
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Forward the webhook to the server application
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    const response = await fetch(`${serverUrl}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'text/plain', // Preserve the raw body format
      },
      body,
    });

    // Return the response from the server
    if (response.ok) {
      return NextResponse.json({ received: true });
    } else {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }
  } catch (error: any) {
    console.error('Error forwarding webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to forward webhook' },
      { status: 500 }
    );
  }
}
