import { connectToDatabase } from '../db/connection';
import User from '../models/User';
import Stripe from 'stripe';
import { getPlanById } from '../config/stripe';

async function syncStripeSubscription() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected to database');
    
    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('Missing Stripe secret key');
      process.exit(1);
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-04-30.basil',
    });
    
    // Find users with Stripe Customer IDs
    const users = await User.find({ 
      stripeCustomerId: { $exists: true, $ne: null }
    });
    
    console.log(`Found ${users.length} users with Stripe Customer IDs`);
    
    for (const user of users) {
      console.log(`\nProcessing user: ${user.email}`);
      console.log(`Stripe Customer ID: ${user.stripeCustomerId}`);
      
      try {
        // Get all subscriptions for this customer from Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'all',
          expand: ['data.items.data.price']
        });
        
        console.log(`Found ${subscriptions.data.length} subscriptions in Stripe`);
        
        if (subscriptions.data.length > 0) {
          // Get the most recent active subscription
          const activeSubscriptions = subscriptions.data.filter(sub => 
            sub.status === 'active' || sub.status === 'trialing'
          );
          
          let subscription = activeSubscriptions.length > 0 
            ? activeSubscriptions[0] 
            : subscriptions.data[0];
          
          console.log(`Using subscription: ${subscription.id} with status: ${subscription.status}`);
          
          // Get the price ID from the subscription
          const priceId = subscription.items.data[0]?.price.id;
          console.log(`Price ID from Stripe: ${priceId}`);
          
          if (priceId) {
            // Look up the plan by price ID
            const plan = getPlanById(priceId);
            console.log('Plan from price ID:', plan);
            
            let planId = '';
            
            if (plan) {
              planId = plan.id;
              console.log(`Mapped to plan ID: ${planId}`);
            } else {
              // Try to determine the plan from the price description or metadata
              const price = subscription.items.data[0]?.price as Stripe.Price;
              console.log('Price details:', {
                nickname: price.nickname,
                product: price.product,
                unitAmount: price.unit_amount
              });
              
              // Check if it's a VIP plan based on price
              if (price.unit_amount) {
                const amount = price.unit_amount / 100; // Convert from cents to dollars
                console.log(`Price amount: $${amount}`);
                
                if (amount >= 1900) {
                  planId = 'vip_yearly';
                  console.log('Identified as vip_yearly based on price');
                } else if (amount >= 190) {
                  planId = 'vip_monthly';
                  console.log('Identified as vip_monthly based on price');
                } else if (amount >= 900) {
                  planId = 'pro_yearly';
                  console.log('Identified as pro_yearly based on price');
                } else if (amount >= 90) {
                  planId = 'pro_monthly';
                  console.log('Identified as pro_monthly based on price');
                } else if (amount >= 290) {
                  planId = 'solo_yearly';
                  console.log('Identified as solo_yearly based on price');
                } else {
                  planId = 'solo_monthly';
                  console.log('Identified as solo_monthly based on price');
                }
              } else {
                // Default to pro_monthly if we can't determine
                planId = 'pro_monthly';
                console.log('Using default plan ID: pro_monthly');
              }
            }
            
            // Update the user's subscription in the database
            if (planId) {
              console.log(`Current plan ID in database: ${user.subscription?.planId}`);
              console.log(`New plan ID from Stripe: ${planId}`);
              
              // Get period dates from Stripe
              const currentPeriodStart = new Date(subscription.current_period_start * 1000);
              const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
              
              // Update the user's subscription
              if (!user.subscription) {
                user.subscription = {
                  planId: planId,
                  status: subscription.status === 'active' ? 'active' : 
                          subscription.status === 'past_due' ? 'past_due' : 'canceled',
                  currentPeriodStart: currentPeriodStart,
                  currentPeriodEnd: currentPeriodEnd,
                  submissionsThisPeriod: 0
                };
                console.log('Created new subscription object');
              } else {
                user.subscription.planId = planId;
                user.subscription.status = subscription.status === 'active' ? 'active' : 
                                          subscription.status === 'past_due' ? 'past_due' : 'canceled';
                user.subscription.currentPeriodStart = currentPeriodStart;
                user.subscription.currentPeriodEnd = currentPeriodEnd;
                console.log('Updated existing subscription object');
              }
              
              await user.save();
              console.log('Saved updated subscription data to database');
            }
          } else {
            console.log('No price ID found in subscription');
          }
        } else {
          console.log('No subscriptions found in Stripe');
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }
    
    console.log('\nSubscription sync completed');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

syncStripeSubscription();
