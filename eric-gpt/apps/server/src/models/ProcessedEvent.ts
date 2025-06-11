import mongoose, { Schema, Document } from "mongoose";
import { Collections } from '@/db/config';

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

// Prevent model overwrites using try-catch pattern
let ProcessedEventModel: mongoose.Model<IProcessedEvent>;
try {
  ProcessedEventModel = mongoose.model<IProcessedEvent>(Collections.WEBHOOK_EVENTS);
} catch (error) {
  ProcessedEventModel = mongoose.model<IProcessedEvent>(Collections.WEBHOOK_EVENTS, ProcessedEventSchema, 'processed_events');
}

export default ProcessedEventModel;