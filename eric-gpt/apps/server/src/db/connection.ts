import mongoose from "mongoose";

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
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
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

export default connectToDatabase;
