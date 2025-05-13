import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  emailVerified?: Date;
  orgId?: Schema.Types.ObjectId;
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
    orgId: { type: Schema.Types.ObjectId, ref: "Organization" },
    stripeCustomerId: { type: String },
    isActive: { type: Boolean, default: true },
    subscription: {
      planId: { type: String },
      status: { 
        type: String, 
        enum: ["active", "past_due", "canceled"],
        default: "active" 
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
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ stripeCustomerId: 1 });
UserSchema.index({ isActive: 1 });

// Check if the model already exists to prevent overwriting during hot reloads
import { Collections } from '../db/config.js';

// Use the configured collection name
export default mongoose.models.User || mongoose.model<IUser>(Collections.USERS, UserSchema);
