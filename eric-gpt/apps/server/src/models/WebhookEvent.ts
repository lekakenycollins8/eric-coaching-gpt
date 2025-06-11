import mongoose, { Schema, Document } from "mongoose";
import { Collections } from '../db/config';

export interface IWebhookEvent extends Document {
  type: string;
  eventId: string;
  data: any;
  processedAt?: Date;
  status: 'pending' | 'processed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema: Schema = new Schema(
  {
    type: { type: String, required: true },
    eventId: { type: String, required: true, unique: true },
    data: { type: Schema.Types.Mixed, required: true },
    processedAt: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    error: { type: String },
  },
  {
    timestamps: true,
  }
);

// Add indexes for frequent queries
WebhookEventSchema.index({ type: 1, status: 1 });
WebhookEventSchema.index({ eventId: 1 }, { unique: true });
WebhookEventSchema.index({ createdAt: 1 });
WebhookEventSchema.index({ status: 1, processedAt: 1 });

// Prevent model overwrites using try-catch pattern
let WebhookEventModel: mongoose.Model<IWebhookEvent>;
try {
  WebhookEventModel = mongoose.model<IWebhookEvent>(Collections.WEBHOOK_EVENTS);
} catch (error) {
  WebhookEventModel = mongoose.model<IWebhookEvent>(Collections.WEBHOOK_EVENTS, WebhookEventSchema);
}

export default WebhookEventModel;
