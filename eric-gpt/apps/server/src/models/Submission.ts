import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  orgId?: Schema.Types.ObjectId;
  worksheetId: string;
  worksheetTitle?: string;
  answers: Record<string, any>;
  aiFeedback: string;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
}

const SubmissionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization" },
    worksheetId: { type: String, required: true },
    worksheetTitle: { type: String },
    answers: { type: Schema.Types.Mixed, required: true },
    aiFeedback: { type: String, required: true },
    tokensUsed: {
      promptTokens: { type: Number, required: true },
      completionTokens: { type: Number, required: true },
      totalTokens: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

// Create index for faster queries
SubmissionSchema.index({ userId: 1, createdAt: -1 });
SubmissionSchema.index({ orgId: 1, createdAt: -1 });

// Check if the model already exists to prevent overwriting during hot reloads
import { Collections } from '@/db/config';

// Use the configured collection name and prevent model overwrites
let SubmissionModel: mongoose.Model<ISubmission>;
try {
  // Try to get existing model first
  SubmissionModel = mongoose.model<ISubmission>(Collections.WORKSHEET_SUBMISSIONS);
} catch (error) {
  // Model doesn't exist yet, create it
  SubmissionModel = mongoose.model<ISubmission>(Collections.WORKSHEET_SUBMISSIONS, SubmissionSchema);
}

export default SubmissionModel;
