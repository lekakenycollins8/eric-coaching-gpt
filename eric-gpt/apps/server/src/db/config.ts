import mongoose from 'mongoose';

export const DATABASE_NAME = 'eric-coaching-gpt';

export const Collections = {
  // Auth Collections
  USERS: 'users',
  ACCOUNTS: 'accounts',
  SESSIONS: 'sessions',
  VERIFICATION_TOKENS: 'verification_tokens',

  // Application Collections
  WORKSHEETS: 'worksheets',
  WORKSHEET_SUBMISSIONS: 'worksheet_submissions',
  FEEDBACK: 'feedback',
  
  // Tracker Collections
  TRACKERS: 'trackers',
  TRACKER_ENTRIES: 'tracker_entries',
  TRACKER_REFLECTIONS: 'tracker_reflections',

  // Subscription & Webhook Collections
  SUBSCRIPTIONS: 'subscriptions',
  WEBHOOK_EVENTS: 'webhook_events',
  STRIPE_EVENTS: 'stripe_events',
  STRIPE_CUSTOMERS: 'stripe_customers',
} as const;

export type CollectionName = typeof Collections[keyof typeof Collections];

import { ConnectOptions } from 'mongoose';

// Database configuration options
export const dbOptions: ConnectOptions = {
  dbName: DATABASE_NAME,
  autoIndex: true, // Build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  retryWrites: true,
  retryReads: true,
  writeConcern: { w: 'majority' }, // Write to primary and replicate to secondaries
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
};
