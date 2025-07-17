import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Interface for workbook diagnosis results
 * @interface IDiagnosisResult
 */
export interface IDiagnosisResult {
  primaryPillars: string[];        // Primary leadership pillars identified
  recommendedWorksheets: string[]; // Recommended worksheets based on diagnosis
  summary: string;                 // Summary of the diagnosis
  createdAt: Date;                 // When the diagnosis was generated
}

/**
 * Interface for workbook submission
 * @interface IWorkbookSubmission
 * @extends Document
 */
export interface IWorkbookSubmission extends Document {
  userId: Types.ObjectId;          // Reference to the user
  workbookId: string;              // Reference to the workbook
  status: 'draft' | 'submitted';   // Submission status
  answers: Record<string, any>;    // User's answers to questions
  diagnosis?: IDiagnosisResult;    // Diagnosis results (if submitted)
  emailSent: boolean;              // Whether email notification was sent
  schedulingPrompted: boolean;     // Whether scheduling was prompted
  createdAt: Date;                 // Creation timestamp
  updatedAt: Date;                 // Last update timestamp
}

// Schema for diagnosis results
const DiagnosisResultSchema = new Schema({
  primaryPillars: {
    type: [String],
    required: true
  },
  recommendedWorksheets: {
    type: [String],
    required: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema for workbook submission
const WorkbookSubmissionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workbookId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted'],
    default: 'draft',
    index: true
  },
  answers: {
    type: Schema.Types.Mixed,
    default: {}
  },
  diagnosis: {
    type: DiagnosisResultSchema,
    default: undefined
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  schedulingPrompted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound index for faster queries
WorkbookSubmissionSchema.index({ userId: 1, workbookId: 1, status: 1 });

// Create model only if it doesn't exist (prevents overwriting during hot reloads)
export const WorkbookSubmission = mongoose.models.WorkbookSubmission || 
  mongoose.model<IWorkbookSubmission>('WorkbookSubmission', WorkbookSubmissionSchema);

export default WorkbookSubmission;
