import { config } from 'dotenv';
import { connectToDatabase } from '../db/connection.js';
import { WebhookEvent } from '../models/index.js';

// Load environment variables
config();

async function viewWebhookEvents() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    // Get the last 10 webhook events
    const events = await WebhookEvent.find()
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('\nLast 10 webhook events:');
    console.log('------------------------');
    
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. Event ID: ${event.eventId}`);
      console.log(`   Type: ${event.type}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Created: ${event.createdAt}`);
      if (event.processedAt) {
        console.log(`   Processed: ${event.processedAt}`);
      }
      console.log(`   Data: ${JSON.stringify(event.data, null, 2)}`);
    });

    console.log('\nTotal events in database:', await WebhookEvent.countDocuments());
    process.exit(0);
  } catch (error) {
    console.error('Error viewing webhook events:', error);
    process.exit(1);
  }
}

viewWebhookEvents();
