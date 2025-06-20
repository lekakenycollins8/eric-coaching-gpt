import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { getPlanById, getPlanByPriceId } from '../../../../config/stripe';
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
      apiVersion: '2025-05-28.basil', // Use the latest stable API version
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
          let priceId = '';
          
          console.log('Attempting to extract plan ID from session:', session.id);
          console.log('Session metadata:', session.metadata);
          
          // First check metadata (this is the most reliable source)
          if (session.metadata && session.metadata.planId) {
            console.log('Found planId in session metadata:', session.metadata.planId);
            planId = session.metadata.planId;
          }
          
          // If no plan ID in metadata, try to get it from line items
          if (!planId && session.line_items) {
            console.log('Checking line items in session');
            // We need to expand the line_items to access them
            try {
              // Retrieve the session with expanded line_items
              const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                expand: ['line_items.data.price']
              });
              
              if (expandedSession.line_items && expandedSession.line_items.data.length > 0) {
                const lineItem = expandedSession.line_items.data[0];
                if (lineItem.price && lineItem.price.id) {
                  priceId = lineItem.price.id;
                  console.log('Found price ID in line items:', priceId);
                  if (priceId) {
                    // Look up the plan by price ID using the dedicated function
                    const plan = getPlanByPriceId(priceId);
                    if (plan) {
                      planId = plan.id;
                      console.log('Mapped price ID to plan ID:', planId);
                    } else {
                      console.log('Could not map price ID to plan using getPlanByPriceId, will try other methods');
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error retrieving expanded session:', error);
            }
          }
          
          // If still no plan ID, try to get it from the subscription
          if (!planId && session.subscription) {
            console.log('Checking subscription in session');
            try {
              const subscriptionId = typeof session.subscription === 'string' ? 
                session.subscription : session.subscription.id;
                
              if (subscriptionId) {
                console.log('Found subscription ID:', subscriptionId);
                const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                  expand: ['items.data.price']
                });
                
                if (subscription.items.data.length > 0) {
                  priceId = subscription.items.data[0].price.id;
                  console.log('Found price ID in subscription:', priceId);
                  
                  // Look up the plan by price ID using the dedicated function
                  const plan = getPlanByPriceId(priceId);
                  console.log('Plan found by price ID:', plan);
                  if (plan) {
                    planId = plan.id;
                    console.log('Mapped price ID to plan ID:', planId);
                  } else {
                    // If we still couldn't map the price ID to a plan, use a direct mapping approach
                    console.log('Could not map price ID to plan using getPlanByPriceId');
                    
                    // Direct mapping of known price IDs to plan IDs using environment variables
                    const priceToPlanMapping: Record<string, string> = {};
                    
                    // Dynamically build the mapping from environment variables
                    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDATION_MONTHLY) {
                      priceToPlanMapping[process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDATION_MONTHLY] = 'foundation_monthly';
                    }
                    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_MOMENTUM_MONTHLY) {
                      priceToPlanMapping[process.env.NEXT_PUBLIC_STRIPE_PRICE_MOMENTUM_MONTHLY] = 'momentum_monthly';
                    }
                    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_LEGACY_MONTHLY) {
                      priceToPlanMapping[process.env.NEXT_PUBLIC_STRIPE_PRICE_LEGACY_MONTHLY] = 'legacy_monthly';
                    }
                    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_EXECUTIVE_MONTHLY) {
                      priceToPlanMapping[process.env.NEXT_PUBLIC_STRIPE_PRICE_EXECUTIVE_MONTHLY] = 'executive_monthly';
                    }
                    
                    if (priceToPlanMapping[priceId]) {
                      planId = priceToPlanMapping[priceId];
                      console.log('Mapped price ID to plan ID using direct mapping:', planId);
                    } else {
                      // If direct mapping fails, try to determine the plan tier and billing cycle from the price amount
                      try {
                        // Get the price details
                        const priceDetails = await stripe.prices.retrieve(priceId);
                        const amount = priceDetails.unit_amount ? priceDetails.unit_amount / 100 : 0;
                        console.log(`Price amount: $${amount}`);
                        
                        // Determine plan based on price amount
                        if (amount >= 999) {
                          planId = 'executive_monthly';
                          console.log('Identified as executive_monthly based on price amount');
                        } else if (amount >= 499) {
                          planId = 'legacy_monthly';
                          console.log('Identified as legacy_monthly based on price amount');
                        } else if (amount >= 199) {
                          planId = 'momentum_monthly';
                          console.log('Identified as momentum_monthly based on price amount');
                        } else {
                          planId = 'foundation_monthly';
                          console.log('Identified as foundation_monthly based on price amount');
                        }
                      } catch (error) {
                        console.error('Error getting price details:', error);
                        planId = 'foundation_monthly'; // Default fallback only if everything else fails
                        console.log('Using default fallback plan ID:', planId);
                      }
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
            console.log('Checking session URL for plan ID');
            try {
              const urlParams = new URL(session.url).searchParams;
              const planFromUrl = urlParams.get('plan');
              if (planFromUrl) {
                planId = planFromUrl;
                console.log('Found plan ID in URL:', planId);
              }
            } catch (error) {
              console.error('Error parsing session URL:', error);
            }
          }
          
          // If we still don't have a plan ID, use a default
          if (!planId) {
            planId = 'foundation_monthly'; // Default to foundation_monthly as a last resort
            console.log('Using default plan ID:', planId);
          }
          
          console.log('Plan ID after extraction:', planId);

          console.log('Final planId after all extraction attempts:', planId);
          
          // Set up the subscription with available information
          if (!user.subscription) {
            // Create new subscription object with proper dates
            const currentPeriodStart = new Date();
            const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
            
            console.log('Creating new subscription with:');
            console.log('- planId:', planId);
            console.log('- currentPeriodStart:', currentPeriodStart);
            console.log('- currentPeriodEnd:', currentPeriodEnd);
            
            user.subscription = {
              planId: planId, // Use the extracted plan ID, no default fallback
              status: 'active',
              currentPeriodStart: currentPeriodStart,
              currentPeriodEnd: currentPeriodEnd,
              submissionsThisPeriod: 0
            };
          } else {
            // Update existing subscription
            console.log('Updating existing subscription with planId:', planId);
            user.subscription.status = 'active';
            
            // Always update the plan ID if we have one
            if (planId) {
              user.subscription.planId = planId;
            }
            
            // Update the period dates
            user.subscription.currentPeriodStart = new Date();
            user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
        
        if (!customerId) {
          console.error('Missing customer ID in invoice');
          break;
        }

        if (!subscriptionId) {
          console.error('Missing subscription ID in invoice');
          break;
        }
        
        let subscription;
        try {
          // Get subscription details to update period dates
          subscription = await stripe.subscriptions.retrieve(subscriptionId);
        } catch (error) {
          console.error('Error retrieving subscription details:', error);
          break;
        }
        
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
