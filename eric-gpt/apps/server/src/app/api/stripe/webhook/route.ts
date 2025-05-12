import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPlanById } from '../../../../config/stripe';
import { connectToDatabase } from '../../../../db/connection';
import User from '../../../../models/User';

export const dynamic = 'force-dynamic';

/**
 * API route for handling Stripe webhooks
 * This updates the user's subscription status when events occur
 */
export async function POST(request: Request) {
  try {
    // Get the request body as text
    const body = await request.text();
    
    // Get the Stripe signature from the headers
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Missing Stripe configuration');
      return NextResponse.json(
        { error: 'Stripe is not properly configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-04-30.basil', // Use the latest stable API version
    });

    // Verify the event
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Log the event for debugging
    console.log(`Received event type: ${event.type}`);
    
    // In Sprint 1, we'll implement the database updates
    // For now, we'll just log the events we're interested in
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const userId = session.client_reference_id as string;
        console.log(`Webhook received customerId: ${customerId} and userId: ${userId}`);

        console.log(`Checkout completed for user: ${userId} with customer ID: ${customerId}`);
        console.log(`Storing customer ID ${customerId} for user ${userId} in database`);

        // Update the user's record in the database
        await connectToDatabase();
        const user = await User.findById(userId);
        console.log(`Webhook found user: ${JSON.stringify(user)}`);

        if (user) {
          user.stripeCustomerId = customerId;
          await user.save();
          console.log(`Successfully updated user ${userId} with customer ID ${customerId} in database`);
        } else {
          console.error(`User not found with ID: ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription updated: ${subscription.id}`);
        
        // Get the customer ID and find the user
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
        if (!customerId) {
          console.error('No customer ID found in subscription update event');
          break;
        }
        
        // Get the plan ID from the subscription
        const priceId = subscription.items.data[0]?.price.id;
        if (!priceId) {
          console.error('No price ID found in subscription');
          break;
        }
        
        // Update the user's subscription in the database
        await connectToDatabase();
        const user = await User.findOne({ stripeCustomerId: customerId });
        
        if (user) {
          // Map Stripe status to our status
          let status = 'active';
          if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            status = 'past_due';
          } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
            status = 'canceled';
          }
          
          // Update the user's subscription
          user.subscription = {
            planId: priceId,
            status: status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            submissionsThisPeriod: user.subscription?.submissionsThisPeriod || 0
          };
          
          await user.save();
          console.log(`Updated subscription for user with ID: ${user._id}`);
        } else {
          console.error(`User not found with customer ID: ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription canceled: ${subscription.id}`);
        
        // Get the customer ID and find the user
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
        if (!customerId) {
          console.error('No customer ID found in subscription deletion event');
          break;
        }
        
        // Update the user's subscription in the database
        await connectToDatabase();
        const user = await User.findOne({ stripeCustomerId: customerId });
        
        if (user && user.subscription) {
          // Mark the subscription as canceled
          user.subscription.status = 'canceled';
          await user.save();
          console.log(`Marked subscription as canceled for user with ID: ${user._id}`);
        } else {
          console.error(`User not found with customer ID: ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        
        console.log(`Payment succeeded for subscription: ${subscriptionId}`);
        
        if (!customerId || !subscriptionId) {
          console.error('Missing customer ID or subscription ID in invoice');
          break;
        }
        
        // Get subscription details to update period dates
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Update the user's subscription in the database
        await connectToDatabase();
        const user = await User.findOne({ stripeCustomerId: customerId });
        
        if (user && user.subscription) {
          // Update the subscription period dates
          user.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
          user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          user.subscription.status = 'active'; // Ensure status is active after successful payment
          user.subscription.submissionsThisPeriod = 0; // Reset submissions counter for new billing period
          
          await user.save();
          console.log(`Updated subscription period for user with ID: ${user._id}`);
        } else {
          console.error(`User not found with customer ID: ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        
        console.log(`Payment failed for subscription: ${subscriptionId}`);
        
        if (!customerId) {
          console.error('No customer ID found in invoice payment failed event');
          break;
        }
        
        // Update the user's subscription in the database
        await connectToDatabase();
        const user = await User.findOne({ stripeCustomerId: customerId });
        
        if (user && user.subscription) {
          // Mark the subscription as past_due
          user.subscription.status = 'past_due';
          await user.save();
          console.log(`Marked subscription as past_due for user with ID: ${user._id}`);
        } else {
          console.error(`User not found with customer ID: ${customerId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling Stripe webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
