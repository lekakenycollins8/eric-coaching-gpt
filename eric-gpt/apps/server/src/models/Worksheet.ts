import mongoose, { Schema, Document } from "mongoose";
// Check if the model already exists to prevent overwriting during hot reloads
import { Collections } from '@/db/config';

export interface IField {
  name: string;
  label: string;
  type: string;
  options?: string[];
  required: boolean;
}

export interface IWorksheet extends Document {
  id: string;
  title: string;
  description?: string;
  systemPromptKey: string;
  fields: IField[];
}

const FieldSchema: Schema = new Schema({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ["info", "text", "textarea", "checkbox", "multiselect", "rating", "table"]
  },
  options: [{ type: String }],
  required: { type: Boolean, default: false }
});

const WorksheetSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    systemPromptKey: { type: String, required: true },
    fields: [FieldSchema]
  },
  { timestamps: true }
);

// Use the configured collection name and prevent model overwrites
let WorksheetModel: mongoose.Model<IWorksheet>;
try {
  // Try to get existing model first
  WorksheetModel = mongoose.model<IWorksheet>(Collections.WORKSHEETS);
} catch (error) {
  // Model doesn't exist yet, create it
  WorksheetModel = mongoose.model<IWorksheet>(Collections.WORKSHEETS, WorksheetSchema);
}

export default WorksheetModel;
