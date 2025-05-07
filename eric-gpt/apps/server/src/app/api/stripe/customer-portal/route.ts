import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * API route for creating a Stripe customer portal session
 * This allows users to manage their subscriptions directly
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const { userId, returnUrl } = await request.json();

    // Validate the required parameters
    if (!userId || !returnUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('Missing Stripe secret key');
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-04-30.basil', // Use the latest stable API version
    });

    // Find the user's Stripe customer ID
    // In a real implementation, this would query the database
    // For Sprint 1, we'll use a placeholder approach
    const mockDb = {
      async findUser(userId: string) {
        console.log(`Looking up user ${userId} in mock database`);
        return {
          id: userId,
          stripeCustomerId: process.env.STRIPE_TEST_CUSTOMER_ID || 'cus_placeholder',
        };
      }
    };

    const user = await mockDb.findUser(userId);
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'User does not have an active subscription' },
        { status: 400 }
      );
    }

    // Create a customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}
