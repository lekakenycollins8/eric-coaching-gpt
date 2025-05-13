import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';
import { connectToDatabase } from '../db/connection.js';
import { User, Subscription, WebhookEvent } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Connect to database
    await connectToDatabase();
    console.log('Connected to database');

    // Create indexes for User model
    console.log('Creating indexes for User collection...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ stripeCustomerId: 1 });
    await User.collection.createIndex({ isActive: 1 });

    // Create indexes for Subscription model
    console.log('Creating indexes for Subscription collection...');
    await Subscription.collection.createIndex({ userId: 1 }, { unique: true });
    await Subscription.collection.createIndex({ stripeCustomerId: 1 });
    await Subscription.collection.createIndex({ stripeSubscriptionId: 1 }, { unique: true });
    await Subscription.collection.createIndex({ status: 1 });
    await Subscription.collection.createIndex({ currentPeriodEnd: 1 });

    // Create indexes for WebhookEvent model
    console.log('Creating indexes for WebhookEvent collection...');
    await WebhookEvent.collection.createIndex({ type: 1, status: 1 });
    await WebhookEvent.collection.createIndex({ eventId: 1 }, { unique: true });
    await WebhookEvent.collection.createIndex({ createdAt: 1 });
    await WebhookEvent.collection.createIndex({ status: 1, processedAt: 1 });

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
