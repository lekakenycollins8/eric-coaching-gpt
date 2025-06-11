import mongoose, { Schema, Document } from "mongoose";
import { Collections } from '../db/config';

export interface ITracker extends Document {
  userId: Schema.Types.ObjectId;
  title: string;
  description: string;
  status: "active" | "completed" | "abandoned";
  startDate: Date;
  endDate: Date;
  submissionId?: Schema.Types.ObjectId; // Optional link to a worksheet submission
  createdAt: Date;
  updatedAt: Date;
}

const TrackerSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["active", "completed", "abandoned"],
      default: "active" 
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    submissionId: { type: Schema.Types.ObjectId, ref: "Submission" },
  },
  { timestamps: true }
);

// Create indexes for faster queries
TrackerSchema.index({ userId: 1, status: 1 });
TrackerSchema.index({ submissionId: 1 });

// Use the configured collection name and prevent model overwrites
let TrackerModel: mongoose.Model<ITracker>;
try {
  TrackerModel = mongoose.model<ITracker>(Collections.TRACKERS);
} catch (error) {
  TrackerModel = mongoose.model<ITracker>(Collections.TRACKERS, TrackerSchema);
}

export default TrackerModel;
