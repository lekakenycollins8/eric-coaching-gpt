import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Interface for workbook question
 * @interface IWorkbookQuestion
 */
export interface IWorkbookQuestion {
  id: string;                     // Unique identifier for the question
  text: string;                   // Question text
  type: 'text' | 'textarea' | 'checkbox' | 'multiselect' | 'rating';
  options?: string[];             // Options for checkbox/multiselect/rating questions
  required: boolean;              // Whether the question is required
}

/**
 * Interface for workbook section
 * @interface IWorkbookSection
 */
export interface IWorkbookSection {
  title: string;                  // Section title
  description?: string;           // Section description
  questions: IWorkbookQuestion[]; // Questions in this section
}

/**
 * Interface for workbook document
 * @interface IWorkbook
 * @extends Document
 */
export interface IWorkbook extends Document {
  title: string;                  // Workbook title
  description: string;            // Workbook description
  sections: IWorkbookSection[];   // Sections in the workbook
  isRequired: boolean;            // Whether the workbook is required for all users
  createdAt: Date;                // Creation timestamp
  updatedAt: Date;                // Last update timestamp
}

// Schema for workbook questions
const WorkbookQuestionSchema = new Schema({
  id: { 
    type: String, 
    required: true,
    trim: true
  },
  text: { 
    type: String, 
    required: true,
    trim: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['text', 'textarea', 'checkbox', 'multiselect', 'rating'],
    default: 'textarea'
  },
  options: {
    type: [String],
    default: undefined
  },
  required: { 
    type: Boolean, 
    default: true 
  }
});

// Schema for workbook sections
const WorkbookSectionSchema = new Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String,
    trim: true 
  },
  questions: {
    type: [WorkbookQuestionSchema],
    default: []
  }
});

// Schema for workbook
const WorkbookSchema = new Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  sections: {
    type: [WorkbookSectionSchema],
    default: []
  },
  isRequired: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true,
  versionKey: false
});

// Add index for faster queries
WorkbookSchema.index({ title: 1, createdAt: -1 });

// Use a more robust pattern to prevent model overwrite errors
let WorkbookModel: mongoose.Model<IWorkbook>;
try {
  // Try to get existing model first
  WorkbookModel = mongoose.model<IWorkbook>('Workbook');
} catch (error) {
  // Model doesn't exist yet, create it
  WorkbookModel = mongoose.model<IWorkbook>('Workbook', WorkbookSchema);
}

export default WorkbookModel;
export { WorkbookModel as Workbook };
