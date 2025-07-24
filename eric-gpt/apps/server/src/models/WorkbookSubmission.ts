import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Interface for follow-up worksheet recommendations
 * @interface IFollowupWorksheets
 */
export interface IFollowupWorksheets {
  pillars: string[];              // Recommended pillar worksheet IDs
  followup?: string;             // Recommended follow-up worksheet ID
}

/**
 * Interface for situation analysis
 * @interface ISituationAnalysis
 */
export interface ISituationAnalysis {
  context?: string;               // Leadership context
  challenges?: string;           // Current challenges
  patterns?: string;             // Behavioral patterns
  impact?: string;               // Organizational impact
  progressLevel?: string;        // Level of progress (e.g., 'excellent', 'good', 'moderate')
  fullText: string;              // Full text of the situation analysis
}

/**
 * Interface for strength analysis
 * @interface IStrengthAnalysis
 */
export interface IStrengthAnalysis {
  strength: string;              // The strength
  evidence: string;              // Evidence of the strength
  impact: string;                // Impact of the strength
  leverage: string;              // How to leverage the strength
}

/**
 * Interface for growth area analysis
 * @interface IGrowthAreaAnalysis
 */
export interface IGrowthAreaAnalysis {
  area: string;                  // The growth area
  evidence: string;              // Evidence of the growth area
  impact: string;                // Impact of the growth area
  rootCause: string;             // Root cause of the growth area
}

/**
 * Interface for actionable recommendation
 * @interface IActionableRecommendation
 */
export interface IActionableRecommendation {
  action: string;                // The action to take
  implementation: string;        // How to implement the action
  outcome: string;               // Expected outcome
  measurement: string;           // How to measure success
}

/**
 * Interface for pillar recommendation
 * @interface IPillarRecommendation
 */
export interface IPillarRecommendation {
  id: string;                    // Pillar ID
  title: string;                 // Pillar title
  reason: string;                // Reason for recommendation
  impact: string;                // Expected impact
  exercise: string;              // Exercise to practice
}

/**
 * Interface for followup recommendation
 * @interface IFollowupRecommendation
 */
export interface IFollowupRecommendation {
  id: string;                    // Followup worksheet ID
  title: string;                 // Followup worksheet title
  reason: string;                // Reason for recommendation
  connection: string;            // Connection to situation
  focus: string;                 // What to focus on
  implementationProgress?: string; // Level of implementation progress
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
  
  // Enhanced fields for more detailed analysis
  situationAnalysis?: ISituationAnalysis;  // Detailed situation analysis
  strengthsAnalysis?: IStrengthAnalysis[]; // Detailed strengths analysis
  growthAreasAnalysis?: IGrowthAreaAnalysis[]; // Detailed growth areas analysis
  actionableRecommendations?: IActionableRecommendation[]; // Detailed actionable recommendations
  pillarRecommendations?: IPillarRecommendation[]; // Detailed pillar recommendations
  followupRecommendation?: IFollowupRecommendation; // Detailed followup recommendation
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
/**
 * Interface for worksheet recommendation
 * @interface IWorksheetRecommendation
 */
// Worksheet recommendation interface removed as per requirements

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

// Schema for situation analysis
const SituationAnalysisSchema = new Schema({
  context: String,
  challenges: String,
  patterns: String,
  impact: String,
  fullText: {
    type: String,
    required: true
  }
}, { _id: false });

// Schema for strength analysis
const StrengthAnalysisSchema = new Schema({
  strength: String,
  evidence: String,
  impact: String,
  leverage: String
}, { _id: false });

// Schema for growth area analysis
const GrowthAreaAnalysisSchema = new Schema({
  area: String,
  evidence: String,
  impact: String,
  rootCause: String
}, { _id: false });

// Schema for actionable recommendation
const ActionableRecommendationSchema = new Schema({
  action: String,
  implementation: String,
  outcome: String,
  measurement: String
}, { _id: false });

// Schema for pillar recommendation
const PillarRecommendationSchema = new Schema({
  id: String,
  title: String,
  reason: String,
  impact: String,
  exercise: String
}, { _id: false });

// Schema for followup recommendation
const FollowupRecommendationSchema = new Schema({
  id: String,
  title: String,
  reason: String,
  connection: String,
  focus: String
}, { _id: false });

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
      },
      followup: {
        type: String,
        required: false
      }
    }, { _id: false }),
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Enhanced fields for more detailed analysis
  situationAnalysis: {
    type: SituationAnalysisSchema,
    required: false
  },
  strengthsAnalysis: {
    type: [StrengthAnalysisSchema],
    required: false
  },
  growthAreasAnalysis: {
    type: [GrowthAreaAnalysisSchema],
    required: false
  },
  actionableRecommendations: {
    type: [ActionableRecommendationSchema],
    required: false
  },
  pillarRecommendations: {
    type: [PillarRecommendationSchema],
    required: false
  },
  followupRecommendation: {
    type: FollowupRecommendationSchema,
    required: false
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

// Worksheet recommendation schema removed as per requirements

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
  // Worksheet recommendations feature removed as per requirements
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
