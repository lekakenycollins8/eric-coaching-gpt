import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_PLANS, getPlanById } from '../../../../config/stripe';

export const dynamic = 'force-dynamic';

/**
 * API route for creating a Stripe checkout session
 * This allows users to subscribe to a plan
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const { planId, userId, email, successUrl, cancelUrl, couponId } = await request.json();

    // Validate the required parameters
    if (!planId || !userId || !email || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the plan details
    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
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

    // Create a checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: email,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      discounts: couponId ? [{ coupon: couponId }] : undefined,
      subscription_data: {
        metadata: {
          userId: userId,
          planId: plan.id,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
