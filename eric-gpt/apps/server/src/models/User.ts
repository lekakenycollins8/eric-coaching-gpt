import mongoose, { Schema, Document } from "mongoose";
// Check if the model already exists to prevent overwriting during hot reloads
import { Collections } from '@/db/config';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  emailVerified?: Date;
  // orgId field removed as Organization feature isn't needed
  stripeCustomerId?: string;
  isActive: boolean;
  subscription?: {
    planId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    submissionsThisPeriod: number;
  };
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: String,
    emailVerified: Date,
    // orgId field removed as Organization feature isn't needed
    stripeCustomerId: { type: String },
    isActive: { type: Boolean, default: true },
    subscription: {
      planId: { type: String },
      status: { 
        type: String, 
        enum: ["active", "past_due", "canceled"], 
      },
      currentPeriodStart: { type: Date },
      currentPeriodEnd: { type: Date },
      submissionsThisPeriod: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for frequent queries
UserSchema.index({ stripeCustomerId: 1 });
UserSchema.index({ isActive: 1 });



// Use the configured collection name and prevent model overwrites
const modelName = Collections.USERS;
let UserModel: mongoose.Model<IUser>;
try {
  // Try to get existing model first
  UserModel = mongoose.model<IUser>(modelName);
} catch (error) {
  // Model doesn't exist yet, create it
  UserModel = mongoose.model<IUser>(modelName, UserSchema);
}

export default UserModel;

/**
 * Gets a user by their email address
 * @param email - The email address to search for
 * @returns The user document or null if not found
 */
export async function getUserByEmail(email: string): Promise<IUser | null> {
  try {
    return await UserModel.findOne({ email });
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}
