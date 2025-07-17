import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Interface for follow-up worksheet recommendations
 * @interface IFollowupWorksheets
 */
export interface IFollowupWorksheets {
  pillars: string[];              // Recommended pillar worksheet IDs
  followup?: string;             // Recommended follow-up worksheet ID (optional)
}

/**
 * Interface for workbook diagnosis results
 * @interface IDiagnosisResult
 */
export interface IDiagnosisResult {
  summary: string;                 // Summary of the diagnosis
  strengths: string[];            // Key strengths identified
  challenges: string[];           // Key challenges or growth areas
  recommendations: string[];      // Specific recommendations for improvement
  followupWorksheets: IFollowupWorksheets; // Recommended worksheets
  createdAt: Date;                // When the diagnosis was generated
}

/**
 * Interface for worksheet submission (both pillar and follow-up)
 * @interface IWorksheetSubmission
 */
export interface IWorksheetSubmission {
  worksheetId: string;                // ID of the worksheet
  answers: Record<string, any>;      // User's answers to worksheet questions
  submittedAt: Date;                 // When the worksheet was submitted
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
  followup?: IWorksheetSubmission; // Follow-up worksheet submission
  pillars?: IWorksheetSubmission[]; // Pillar worksheet submissions
  emailSent: boolean;              // Whether email notification was sent
  schedulingPrompted: boolean;     // Whether scheduling was prompted
  createdAt: Date;                 // Creation timestamp
  updatedAt: Date;                 // Last update timestamp
  diagnosisGeneratedAt?: Date;     // When the diagnosis was generated
}

// Schema for follow-up worksheet recommendations
const FollowupWorksheetsSchema = new Schema({
  pillars: {
    type: [String],
    required: true
  },
  followup: {
    type: String,
    required: true
  }
});

// Schema for diagnosis results
const DiagnosisResultSchema = new Schema({
  summary: {
    type: String,
    required: true,
    trim: true
  },
  strengths: {
    type: [String],
    required: true
  },
  challenges: {
    type: [String],
    required: true
  },
  recommendations: {
    type: [String],
    required: true
  },
  followupWorksheets: {
    type: FollowupWorksheetsSchema,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema for worksheet submission (both pillar and follow-up)
const WorksheetSubmissionSchema = new Schema({
  worksheetId: {
    type: String,
    required: true
  },
  answers: {
    type: Schema.Types.Mixed,
    default: {}
  },
  submittedAt: {
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
  followup: {
    type: WorksheetSubmissionSchema,
    default: undefined
  },
  pillars: {
    type: [WorksheetSubmissionSchema],
    default: undefined
  },
  diagnosisGeneratedAt: {
    type: Date,
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
