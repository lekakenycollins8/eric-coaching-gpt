import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  userId: Schema.Types.ObjectId;
  orgId?: Schema.Types.ObjectId;
  worksheetId: string;
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
export default mongoose.models.Submission || 
  mongoose.model<ISubmission>("Submission", SubmissionSchema);
