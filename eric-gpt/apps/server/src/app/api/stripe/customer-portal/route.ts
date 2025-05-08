import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '../../../../db/connection';
import User from '../../../../models/User';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * API route for creating a Stripe customer portal session
 * This allows users to manage their subscriptions directly
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const { userId, returnUrl } = await request.json();
    console.log(`Received userId: ${userId} and returnUrl: ${returnUrl}`);

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

    // Find the user's Stripe customer ID from the database

    await connectToDatabase();

    const user = await User.findById(userId);
    console.log(`Finding user with ID: ${userId}`);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const stripeCustomerId = user.stripeCustomerId;
    console.log(`Found user with ID: ${userId} and customer ID: ${stripeCustomerId}`);

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'User does not have an active subscription' },
        { status: 400 }
      );
    }

    // Create a customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
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
