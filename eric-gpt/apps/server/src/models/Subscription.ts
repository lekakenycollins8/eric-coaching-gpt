import mongoose, { Schema, Document } from "mongoose";
import { Collections } from '../db/config.js';

export interface ISubscription extends Document {
  userId: Schema.Types.ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  usageQuota: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    plan: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'],
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    usageQuota: { type: Number, required: true },
    usageCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Add indexes for frequent queries
SubscriptionSchema.index({ userId: 1 }, { unique: true });
SubscriptionSchema.index({ stripeCustomerId: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 }, { unique: true });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });

export default mongoose.models.Subscription ||
  mongoose.model<ISubscription>(Collections.SUBSCRIPTIONS, SubscriptionSchema);
