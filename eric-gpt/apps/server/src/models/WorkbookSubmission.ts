import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Interface for follow-up worksheet recommendations
 * @interface IFollowupWorksheets
 */
export interface IFollowupWorksheets {
  pillars: string[];              // Recommended pillar worksheet IDs
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
  diagnosisGeneratedAt?: Date;     // When the diagnosis was generated
  diagnosisViewedAt?: Date;        // When the user viewed the diagnosis
  updatedAt: Date;                 // Last update timestamp
}

// Schema for follow-up worksheet recommendations
const FollowupWorksheetsSchema = new Schema({
  pillars: {
    type: [String],
    required: true,
    default: []
  },
  followup: {
    type: String,
    required: false,
    default: undefined
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
    type: new Schema({
      pillars: {
        type: [String],
        required: true,
        default: []
      }
    }, { _id: false }),
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
  diagnosisViewedAt: {
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

// Use a more robust pattern to prevent model overwrite errors
let WorkbookSubmissionModel: mongoose.Model<IWorkbookSubmission>;
try {
  // Try to get existing model first
  WorkbookSubmissionModel = mongoose.model<IWorkbookSubmission>('WorkbookSubmission');
} catch (error) {
  // Model doesn't exist yet, create it
  WorkbookSubmissionModel = mongoose.model<IWorkbookSubmission>('WorkbookSubmission', WorkbookSubmissionSchema);
}

export default WorkbookSubmissionModel;
export { WorkbookSubmissionModel as WorkbookSubmission };
