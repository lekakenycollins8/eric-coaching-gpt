import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_PLANS, getPlanById } from '../../../../config/stripe';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/stripe/create-checkout-session:
 *   post:
 *     summary: Create a Stripe checkout session
 *     description: Creates a checkout session for subscribing to a plan
 *     tags:
 *       - Stripe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - userId
 *               - email
 *               - successUrl
 *               - cancelUrl
 *             properties:
 *               planId:
 *                 type: string
 *                 description: ID of the plan to subscribe to
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user
 *               successUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect to after successful payment
 *               cancelUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect to if payment is cancelled
 *               couponId:
 *                 type: string
 *                 description: Optional coupon ID for discount
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: ID of the created checkout session
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: URL to redirect the user to for payment
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
    console.log('Stripe secret key:', stripeSecretKey ? 'exists' : 'missing');
    console.log('Stripe secret key value:', stripeSecretKey);
    
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
    console.log('Plan details:', JSON.stringify(plan, null, 2));
    
    try {
      console.log('Creating checkout session...');
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
          planId: planId,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log('Checkout session created with metadata:', JSON.stringify(checkoutSession.metadata, null, 2));

    console.log('Checkout session created successfully:');
    console.log('Checkout session object:', JSON.stringify(checkoutSession, null, 2));
    console.log('Checkout session ID:', checkoutSession.id);
    console.log('Checkout session URL:', checkoutSession.url);
      
      return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
    } catch (stripeError) {
      const error = stripeError as Stripe.StripeRawError;
      console.error('Stripe error creating checkout session:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create Stripe checkout session' },
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
