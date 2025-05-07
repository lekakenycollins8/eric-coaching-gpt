import mongoose, { Schema, Document } from "mongoose";

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
    enum: ["text", "textarea", "checkbox", "multiselect", "rating", "table"]
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

// Check if the model already exists to prevent overwriting during hot reloads
export default mongoose.models.Worksheet || 
  mongoose.model<IWorksheet>("Worksheet", WorksheetSchema);
