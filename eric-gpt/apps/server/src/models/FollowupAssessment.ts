import mongoose, { Document, Schema, Types } from 'mongoose';
import { IDiagnosisResult } from './WorkbookSubmission';

/**
 * Type definition for follow-up category
 */
export type FollowupCategoryType = 'pillar' | 'workbook';

/**
 * Interface for follow-up metadata
 */
export interface IFollowupMetadata {
  pillarId?: string;           // For pillar follow-ups, the specific pillar ID
  timeElapsed?: string;        // Time elapsed since original submission
  improvementScore?: number;   // Calculated improvement score (0-100)
  originalTitle?: string;      // Title of the original worksheet
  followupTitle?: string;      // Title of the follow-up worksheet
}

/**
 * Interface for followup assessment
 * @interface IFollowupAssessment
 * @extends Document
 */
export interface IFollowupAssessment extends Document {
  userId: Types.ObjectId;          // Reference to the user
  workbookSubmissionId: Types.ObjectId; // Reference to the original workbook submission
  followupId: string;              // ID of the followup worksheet
  followupType: FollowupCategoryType; // Type of follow-up (pillar or workbook)
  status: 'pending' | 'completed'; // Status of the followup assessment
  answers: Record<string, any>;    // User's answers to followup questions
  diagnosis?: IDiagnosisResult;    // AI-generated diagnosis for the follow-up
  metadata?: IFollowupMetadata;    // Additional metadata for the follow-up
  createdAt: Date;                 // Creation timestamp
  updatedAt: Date;                 // Last update timestamp
  scheduledFor?: Date;             // When the followup is scheduled to be presented
  completedAt?: Date;              // When the followup was completed
  diagnosisGeneratedAt?: Date;     // When the diagnosis was generated
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
  followupType: {
    type: String,
    enum: ['pillar', 'workbook'],
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
  diagnosis: {
    type: Schema.Types.Mixed,
    default: undefined
  },
  metadata: {
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
  },
  diagnosisGeneratedAt: {
    type: Date,
    default: undefined
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound indexes for faster queries
FollowupAssessmentSchema.index({ userId: 1, status: 1 });
FollowupAssessmentSchema.index({ workbookSubmissionId: 1, followupId: 1 }, { unique: true });
FollowupAssessmentSchema.index({ userId: 1, followupType: 1 }); // For querying by user and follow-up type
FollowupAssessmentSchema.index({ followupType: 1, status: 1 }); // For querying by follow-up type and status

// Create model only if it doesn't exist (prevents overwriting during hot reloads)
export const FollowupAssessment = mongoose.models.FollowupAssessment || 
  mongoose.model<IFollowupAssessment>('FollowupAssessment', FollowupAssessmentSchema);

export default FollowupAssessment;
