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
    console.log('Received checkout session request');
    
    // Parse the request body
    const body = await request.json();
    const { planId, userId, email, successUrl, cancelUrl, couponId } = body;
    
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate the required parameters
    if (!planId || !userId || !email || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the plan details
    const plan = getPlanById(planId);
    console.log('Looking for plan with ID:', planId);
    console.log('Available plans:', Object.values(STRIPE_PLANS).map(p => p.id));
    console.log('Found plan:', plan);
    
    if (!plan) {
      console.error('Invalid plan ID:', planId);
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    console.log('Stripe secret key exists:', !!stripeSecretKey);
    
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
    console.log('Creating checkout session with price ID:', plan.priceId);
    
    try {
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

      console.log('Checkout session created successfully:', {
        id: checkoutSession.id,
        url: checkoutSession.url
      });
      
      return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
    } catch (stripeError) {
      console.error('Stripe error creating checkout session:', stripeError);
      return NextResponse.json(
        { error: stripeError.message || 'Failed to create Stripe checkout session' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
