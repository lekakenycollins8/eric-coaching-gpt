import mongoose, { Schema, Document } from "mongoose";

export interface IProcessedEvent extends Document {
  eventId: string;
  eventType: string;
  processedAt: Date;
}

const ProcessedEventSchema: Schema = new Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

// Use the configured collection name
import { Collections } from '@/db/config';

export default mongoose.models.ProcessedEvent || mongoose.model<IProcessedEvent>(Collections.WEBHOOK_EVENTS, ProcessedEventSchema, 'processed_events');