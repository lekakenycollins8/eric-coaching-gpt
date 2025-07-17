import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Interface for followup assessment
 * @interface IFollowupAssessment
 * @extends Document
 */
export interface IFollowupAssessment extends Document {
  userId: Types.ObjectId;          // Reference to the user
  workbookSubmissionId: Types.ObjectId; // Reference to the original workbook submission
  followupId: string;              // ID of the followup worksheet
  status: 'pending' | 'completed'; // Status of the followup assessment
  answers: Record<string, any>;    // User's answers to followup questions
  createdAt: Date;                 // Creation timestamp
  updatedAt: Date;                 // Last update timestamp
  scheduledFor?: Date;             // When the followup is scheduled to be presented
  completedAt?: Date;              // When the followup was completed
}

// Schema for followup assessment
const FollowupAssessmentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workbookSubmissionId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkbookSubmission',
    required: true,
    index: true
  },
  followupId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
    index: true
  },
  answers: {
    type: Schema.Types.Mixed,
    default: {}
  },
  scheduledFor: {
    type: Date,
    default: undefined
  },
  completedAt: {
    type: Date,
    default: undefined
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound index for faster queries
FollowupAssessmentSchema.index({ userId: 1, status: 1 });
FollowupAssessmentSchema.index({ workbookSubmissionId: 1, followupId: 1 }, { unique: true });

// Create model only if it doesn't exist (prevents overwriting during hot reloads)
export const FollowupAssessment = mongoose.models.FollowupAssessment || 
  mongoose.model<IFollowupAssessment>('FollowupAssessment', FollowupAssessmentSchema);

export default FollowupAssessment;
