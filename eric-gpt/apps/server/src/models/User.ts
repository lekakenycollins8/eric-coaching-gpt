import mongoose, { Schema, Document } from "mongoose";

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

// Check if the model already exists to prevent overwriting during hot reloads
import { Collections } from '@/db/config';

// Use the configured collection name
// Make sure we don't try to recompile the model if it already exists
const modelName = Collections.USERS;
const User = mongoose.models[modelName] as mongoose.Model<IUser> || mongoose.model<IUser>(modelName, UserSchema);
export default User;
