import { connectToDatabase } from '../db/connection';
import User from '../models/User';

async function fixSubscription() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected to database');
    
    // Find users with Stripe Customer IDs but incomplete subscription data
    const users = await User.find({ 
      stripeCustomerId: { $exists: true, $ne: null },
      $or: [
        { 'subscription.planId': { $exists: false } },
        { 'subscription.planId': '' },
        { 'subscription.planId': null }
      ]
    });
    
    console.log(`Found ${users.length} users with Stripe Customer IDs but missing plan IDs`);
    
    for (const user of users) {
      console.log(`\nFixing subscription for user: ${user.email}`);
      console.log(`Stripe Customer ID: ${user.stripeCustomerId}`);
      
      // Set default values if subscription exists but is incomplete
      if (user.subscription) {
        // Set a default plan ID if missing
        if (!user.subscription.planId) {
          user.subscription.planId = 'pro_monthly';
          console.log('Set default plan ID: pro_monthly');
        }
        
        // Set current period dates if missing
        if (!user.subscription.currentPeriodStart) {
          user.subscription.currentPeriodStart = new Date();
          console.log('Set current period start to now');
        }
        
        if (!user.subscription.currentPeriodEnd) {
          // Set end date to 30 days from start date
          const endDate = new Date(user.subscription.currentPeriodStart);
          endDate.setDate(endDate.getDate() + 30);
          user.subscription.currentPeriodEnd = endDate;
          console.log(`Set current period end to ${endDate}`);
        }
      } else {
        // Create a new subscription object if none exists
        user.subscription = {
          planId: 'pro_monthly',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          submissionsThisPeriod: 0
        };
        console.log('Created new subscription object with default values');
      }
      
      // Save the updated user
      await user.save();
      console.log('Saved updated subscription data');
    }
    
    console.log('\nSubscription fix completed');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixSubscription();
