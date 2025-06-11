import mongoose, { Schema, Document } from "mongoose";
import { Collections } from '../db/config';

export interface ITrackerReflection extends Document {
  trackerId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const TrackerReflectionSchema: Schema = new Schema(
  {
    trackerId: { type: Schema.Types.ObjectId, ref: "Tracker", required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

// Create indexes for faster queries
TrackerReflectionSchema.index({ trackerId: 1 }, { unique: true });
TrackerReflectionSchema.index({ userId: 1 });

// Use the configured collection name and prevent model overwrites
let TrackerReflectionModel: mongoose.Model<ITrackerReflection>;
try {
  TrackerReflectionModel = mongoose.model<ITrackerReflection>(Collections.TRACKER_REFLECTIONS);
} catch (error) {
  TrackerReflectionModel = mongoose.model<ITrackerReflection>(Collections.TRACKER_REFLECTIONS, TrackerReflectionSchema);
}

export default TrackerReflectionModel;
