/**
 * Types for the worksheet system
 */

export type FieldType = 'text' | 'textarea' | 'rating' | 'checkbox' | 'multiselect' | 'info';

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface Worksheet {
  id: string;
  title: string;
  description: string;
  systemPromptKey: string;
  fields: Field[];
}

export interface WorksheetSubmission {
  worksheetId: string;
  answers: Record<string, any>;
}

export interface WorksheetResponse {
  worksheets: Worksheet[];
}

export interface WorksheetFeedback {
  submissionId: string;
  feedback: string;
}
