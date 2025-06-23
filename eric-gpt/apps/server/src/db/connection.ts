import mongoose from "mongoose";
import { config } from 'dotenv';
import { dbOptions, DATABASE_NAME } from './config';
import path from 'path';
import { loadAllWorksheets } from '@/utils/worksheetLoader';

// Import server initialization to run validation
import '../lib/serverInit';

// Load environment variables
config();

/**
 * MongoDB connection utility with proper error handling and connection pooling
 */
const MONGODB_URI = process.env.DATABASE_URL || "";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the DATABASE_URL environment variable inside .env"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// Define the mongoose cache interface
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Add mongoose property to NodeJS.Global interface
declare global {
  var mongoose: MongooseCache | undefined;
}

// Initialize the cache
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Ensure global mongoose cache is set
global.mongoose = cached;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      ...dbOptions,
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log(`Connected to database: ${DATABASE_NAME}`);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Initialize worksheets in the database from the JSON file
 * This ensures the worksheets are available for the application
 */
async function initializeWorksheets() {
  try {
    // Wait for import to avoid circular dependencies
    const Worksheet = (await import('../models/Worksheet')).default;
    
    // Check if worksheets already exist
    const worksheetCount = await Worksheet.countDocuments();
    
    if (worksheetCount === 0) {
      console.log('No worksheets found in database. Seeding from JSON file...');
      
      // Load worksheets from individual JSON files
      const worksheetsData = await loadAllWorksheets();
      
      console.log(`Loaded ${worksheetsData.length} worksheets from JSON file`);
      
      // Insert the worksheets into the database
      await Worksheet.insertMany(worksheetsData);
      
      console.log(`Successfully seeded ${worksheetsData.length} worksheets into database`);
    } else {
      console.log(`Found ${worksheetCount} worksheets already in database`);
    }
  } catch (error) {
    console.error('Error initializing worksheets:', error);
  }
}

export default connectToDatabase;
