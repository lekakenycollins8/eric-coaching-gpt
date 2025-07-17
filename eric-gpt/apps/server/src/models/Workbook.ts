import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkbookQuestion {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'checkbox' | 'multiselect' | 'rating';
  options?: string[];
  required: boolean;
}

export interface IWorkbookSection {
  title: string;
  description?: string;
  questions: IWorkbookQuestion[];
}

export interface IWorkbook extends Document {
  title: string;
  description: string;
  sections: IWorkbookSection[];
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkbookQuestionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['text', 'textarea', 'checkbox', 'multiselect', 'rating']
  },
  options: [String],
  required: { type: Boolean, default: true }
});

const WorkbookSectionSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  questions: [WorkbookQuestionSchema]
});

const WorkbookSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  sections: [WorkbookSectionSchema],
  isRequired: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create model only if it doesn't exist (prevents overwriting during hot reloads)
export const Workbook = mongoose.models.Workbook || mongoose.model<IWorkbook>('Workbook', WorkbookSchema);

export default Workbook;
