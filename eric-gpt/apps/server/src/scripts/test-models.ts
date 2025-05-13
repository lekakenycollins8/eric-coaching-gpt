import mongoose from 'mongoose';
import { config } from 'dotenv';
import { connectToDatabase } from '../db/connection.js';
import { User, Subscription, WebhookEvent } from '../models/index.js';

// Load environment variables
config();

async function testModels() {
  try {
    console.log('Starting model tests...');
    
    // Connect to database
    await connectToDatabase();
    console.log('Connected to database');

    // Create a test user
    const testUser = new User({
      email: 'test@example.com',
      name: 'Test User',
      stripeCustomerId: 'cus_test123',
      isActive: true
    });

    // Test unique email constraint
    try {
      await testUser.save();
      console.log('Created test user successfully');

      // Try to create another user with same email
      const duplicateUser = new User({
        email: 'test@example.com',
        name: 'Duplicate User'
      });
      await duplicateUser.save();
    } catch (error: any) {
      if (error.code === 11000) {
        console.log('✓ Unique email constraint working');
      } else {
        throw error;
      }
    }

    // Create a subscription
    const testSubscription = new Subscription({
      userId: testUser._id,
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      plan: 'pro',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
      usageQuota: 1000
    });

    await testSubscription.save();
    console.log('Created test subscription successfully');

    // Create a webhook event
    const testEvent = new WebhookEvent({
      type: 'customer.subscription.updated',
      eventId: 'evt_test123',
      status: 'pending',
      data: { subscription: 'sub_test123' },
      createdAt: new Date()
    });

    await testEvent.save();
    console.log('Created test webhook event successfully');

    // Test indexes by performing queries
    console.log('\nTesting indexes...');

    // Test User indexes
    console.time('User email query');
    const userByEmail = await User.findOne({ email: 'test@example.com' });
    console.timeEnd('User email query');
    console.log('✓ Found user by email:', userByEmail?.email);

    // Test Subscription indexes
    console.time('Subscription status query');
    const activeSubscriptions = await Subscription.find({ status: 'active' });
    console.timeEnd('Subscription status query');
    console.log('✓ Found active subscriptions:', activeSubscriptions.length);

    // Test WebhookEvent indexes
    console.time('WebhookEvent type+status query');
    const pendingEvents = await WebhookEvent.find({ 
      type: 'customer.subscription.updated',
      status: 'pending'
    });
    console.timeEnd('WebhookEvent type+status query');
    console.log('✓ Found pending events:', pendingEvents.length);

    // Clean up test data
    await User.deleteOne({ email: 'test@example.com' });
    await Subscription.deleteOne({ stripeSubscriptionId: 'sub_test123' });
    await WebhookEvent.deleteOne({ eventId: 'evt_test123' });
    console.log('\nCleaned up test data');

    console.log('\nAll tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testModels();
