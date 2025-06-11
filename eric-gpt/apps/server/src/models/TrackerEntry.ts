import mongoose, { Schema, Document } from "mongoose";
import { Collections } from '@/db/config';

export interface ITrackerEntry extends Document {
  trackerId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  day: number; // 1-5 for the 5-day tracker
  completed: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const TrackerEntrySchema: Schema = new Schema(
  {
    trackerId: { type: Schema.Types.ObjectId, ref: "Tracker", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: Number, required: true, min: 1, max: 5 },
    completed: { type: Boolean, default: false },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Create indexes for faster queries
TrackerEntrySchema.index({ trackerId: 1, day: 1 }, { unique: true });
TrackerEntrySchema.index({ userId: 1 });

// Use the configured collection name and prevent model overwrites
let TrackerEntryModel: mongoose.Model<ITrackerEntry>;
try {
  TrackerEntryModel = mongoose.model<ITrackerEntry>(Collections.TRACKER_ENTRIES);
} catch (error) {
  TrackerEntryModel = mongoose.model<ITrackerEntry>(Collections.TRACKER_ENTRIES, TrackerEntrySchema);
}

export default TrackerEntryModel;
