import { connectToDatabase } from '../db/connection';
import User from '../models/User';

async function fixVipSubscription() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected to database');
    
    // Find the user by email
    const user = await User.findOne({ email: 'lekakenycollins999@gmail.com' });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('Found user:', user.email);
    console.log('Current subscription:', user.subscription);
    
    // Update the subscription to VIP yearly
    if (!user.subscription) {
      user.subscription = {
        planId: 'vip_yearly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        submissionsThisPeriod: 0
      };
    } else {
      user.subscription.planId = 'vip_yearly';
      // Only update dates if they're not already set
      if (!user.subscription.currentPeriodStart || isNaN(user.subscription.currentPeriodStart.getTime())) {
        user.subscription.currentPeriodStart = new Date();
      }
      if (!user.subscription.currentPeriodEnd || isNaN(user.subscription.currentPeriodEnd.getTime())) {
        user.subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
    }
    
    // Save the updated user
    await user.save();
    
    console.log('Updated subscription:', user.subscription);
    console.log('Subscription successfully updated to VIP Yearly');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixVipSubscription();
