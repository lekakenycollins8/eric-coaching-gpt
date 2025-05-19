import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { getPlanById } from '../../../../config/stripe';
import { connectToDatabase } from '../../../../db/connection';
import User from '../../../../models/User';

export const dynamic = 'force-dynamic';

// Define interfaces for better type safety
interface StripeSubscriptionWithDates extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

interface StripeInvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string | Stripe.Subscription;
}

/**
 * @swagger
 * /api/stripe/webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     description: Processes Stripe webhook events for subscription management
 *     tags:
 *       - Stripe
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         schema:
 *           type: string
 *         required: true
 *         description: Stripe signature for webhook verification
 *     responses:
 *       200:
 *         description: Webhook event processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 idempotent:
 *                   type: boolean
 *                   description: Indicates if this event was already processed
 *       400:
 *         description: Bad request - missing or invalid signature
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
    // Get the request body as text
    const body = await request.text();
    
    // Get the Stripe signature from the headers
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature in webhook request');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }
    
    // Store the raw body for signature verification
    const rawBody = body;

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

    // Verify the event with enhanced error handling
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }
    
    // Implement idempotency handling to prevent duplicate processing
    const eventId = event.id;
    
    // Check if we've already processed this event
    try {
      await connectToDatabase();
      let ProcessedEvent;
      if (mongoose.models.ProcessedEvent) {
        ProcessedEvent = mongoose.models.ProcessedEvent;
      } else {
        ProcessedEvent = mongoose.model('ProcessedEvent', new mongoose.Schema({
          eventId: { type: String, required: true, unique: true },
          eventType: { type: String, required: true },
          processedAt: { type: Date, default: Date.now }
        }));
      }
      
      // Check if this event has already been processed
      const existingEvent = await (ProcessedEvent as mongoose.Model<any>).findOne({ eventId });
      if (existingEvent) {
        console.log(`Event ${eventId} has already been processed, skipping`);
        return NextResponse.json({ received: true, idempotent: true });
      }
      
      // Mark this event as processed
      const newEvent = new ProcessedEvent({
        eventId,
        eventType: event.type,
        processedAt: new Date()
      });
      await newEvent.save();
      
    } catch (error) {
      console.error('Error checking for duplicate event:', error);
      // Continue processing even if idempotency check fails
      // It's better to risk duplicate processing than missing an event
    }

    // Log the event for debugging
    console.log(`Received event type: ${event.type}`);
    
    // Handle different event types
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

        // Get the customer's name from the session
        const customerName = session?.customer_details?.name || 'Unknown User';

        if (user) {
          // Store the Stripe customer ID
          user.stripeCustomerId = customerId;
          user.name = customerName; // Update the customer's name
          
          // Get the plan ID from the checkout session metadata or line items
          let planId = '';
          if (session.metadata && session.metadata.planId) {
            planId = session.metadata.planId;
          } else if (session.line_items) {
            // Try to get plan from line items if available
            console.log('Line items available in session');
          } else {
            // Try to retrieve the subscription to get the plan ID
            try {
              // If session has a subscription, get its details
              if (session.subscription) {
                const subscriptionId = typeof session.subscription === 'string' ? 
                  session.subscription : session.subscription.id;
                  
                if (subscriptionId) {
                  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                  const priceId = subscription.items.data[0]?.price.id;
                  if (priceId) {
                    // Look up the plan by price ID
                    const plan = getPlanById(priceId);
                    if (plan) {
                      planId = plan.id;
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error retrieving subscription details:', error);
            }
          }
          
          // If we still don't have a plan ID, try to get it from the session URL
          if (!planId && session.url) {
            // Extract plan ID from URL if possible
            const urlParams = new URL(session.url).searchParams;
            const planFromUrl = urlParams.get('plan');
            if (planFromUrl) {
              planId = planFromUrl;
            }
          }
          
          // Set up the subscription with available information
          if (!user.subscription) {
            user.subscription = {
              planId: planId || 'pro_monthly', // Default to pro_monthly if we couldn't determine the plan
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              submissionsThisPeriod: 0
            };
          } else {
            // Update existing subscription
            user.subscription.status = 'active';
            if (planId) {
              user.subscription.planId = planId;
            }
          }
          
          // Use a database session with transaction to ensure data consistency
          const dbSession = await mongoose.startSession();
          try {
            dbSession.startTransaction();
            
            // Save within the transaction
            await user.save({ session: dbSession });
            
            // Commit the transaction
            await dbSession.commitTransaction();
            console.log(`Successfully updated user ${userId} with customer ID ${customerId} and subscription in database`);
          } catch (error) {
            // If an error occurs, abort the transaction
            await dbSession.abortTransaction();
            console.error(`Transaction failed for user ${userId}:`, error);
            throw error; // Re-throw to be caught by the outer try/catch
          } finally {
            // End the session
            dbSession.endSession();
          }
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
          // Safely convert Unix timestamps to Date objects
          // Use type assertion to handle Stripe API type issues
          const subWithDates = subscription as unknown as StripeSubscriptionWithDates;
          const startTimestamp = subWithDates.current_period_start || Math.floor(Date.now() / 1000);
          const endTimestamp = subWithDates.current_period_end || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
          
          const currentPeriodStart = new Date(startTimestamp * 1000);
          const currentPeriodEnd = new Date(endTimestamp * 1000);
            
          // Log the dates for debugging
          console.log('Period start timestamp:', startTimestamp);
          console.log('Period end timestamp:', endTimestamp);
          console.log('Converted start date:', currentPeriodStart);
          console.log('Converted end date:', currentPeriodEnd);
          
          // Get plan ID from our config if possible
          const plan = getPlanById(priceId);
          const planId = plan?.id || priceId;
          
          user.subscription = {
            planId: planId, // Use our plan ID if available
            status: status,
            currentPeriodStart: currentPeriodStart,
            currentPeriodEnd: currentPeriodEnd,
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
        const invoice = event.data.object as StripeInvoiceWithSubscription;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        
        // Get subscription ID safely using type casting
        let subscriptionId: string | undefined;
        if (invoice.subscription) {
          subscriptionId = typeof invoice.subscription === 'string' ? 
            invoice.subscription : 
            (invoice.subscription as Stripe.Subscription).id;
        }
        
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
          // Safely get period timestamps
          const subWithDates = subscription as unknown as StripeSubscriptionWithDates;
          const startTimestamp = subWithDates.current_period_start || Math.floor(Date.now() / 1000);
          const endTimestamp = subWithDates.current_period_end || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
          
          // Update the subscription period dates
          user.subscription.currentPeriodStart = new Date(startTimestamp * 1000);
          user.subscription.currentPeriodEnd = new Date(endTimestamp * 1000);
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
        const invoice = event.data.object as StripeInvoiceWithSubscription;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        
        // Get subscription ID safely using type casting
        let subscriptionId: string | undefined;
        if (invoice.subscription) {
          subscriptionId = typeof invoice.subscription === 'string' ? 
            invoice.subscription : 
            (invoice.subscription as Stripe.Subscription).id;
        }
        
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
