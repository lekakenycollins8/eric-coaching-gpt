import { connectToDatabase } from '../db/connection';
import User from '../models/User';

async function checkSubscription() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected to database');
    
    // Find a user with a subscription
    const users = await User.find({}).limit(5);
    
    console.log(`Found ${users.length} users`);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`Email: ${user.email}`);
      console.log(`Stripe Customer ID: ${user.stripeCustomerId || 'Not set'}`);
      
      if (user.subscription) {
        console.log('Subscription:');
        console.log(`  Plan ID: ${user.subscription.planId || 'Not set'}`);
        console.log(`  Status: ${user.subscription.status || 'Not set'}`);
        console.log(`  Current Period Start: ${user.subscription.currentPeriodStart || 'Not set'}`);
        console.log(`  Current Period End: ${user.subscription.currentPeriodEnd || 'Not set'}`);
        console.log(`  Submissions This Period: ${user.subscription.submissionsThisPeriod || 0}`);
      } else {
        console.log('No subscription data found');
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSubscription();
