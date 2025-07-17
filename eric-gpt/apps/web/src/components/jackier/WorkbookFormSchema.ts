import { z } from 'zod';

interface Question {
  id: string;
  type: string;
  required?: boolean;
  min?: number;
  max?: number;
}

interface Section {
  questions: Question[];
}

interface Workbook {
  sections: Section[];
}

export function createWorkbookFormSchema(workbook: Workbook | null) {
  if (!workbook) return z.object({});
  
  const schemaFields: Record<string, any> = {};
  
  workbook.sections.forEach(section => {
    section.questions.forEach(question => {
      if (question.required) {
        switch (question.type) {
          case 'text':
          case 'textarea':
            schemaFields[question.id] = z.string().min(1, 'This field is required');
            break;
          case 'rating':
          case 'scale':
            schemaFields[question.id] = z.number().min(question.min || 1).max(question.max || 10);
            break;
          case 'checkbox':
            schemaFields[question.id] = z.array(z.string()).min(1, 'Select at least one option');
            break;
          case 'choice':
            schemaFields[question.id] = z.string().min(1, 'Please select an option');
            break;
          default:
            // For info type questions, no validation needed
            break;
        }
      } else {
        // Optional fields
        switch (question.type) {
          case 'text':
          case 'textarea':
            schemaFields[question.id] = z.string().optional();
            break;
          case 'rating':
          case 'scale':
            schemaFields[question.id] = z.number().optional();
            break;
          case 'checkbox':
            schemaFields[question.id] = z.array(z.string()).optional();
            break;
          case 'choice':
            schemaFields[question.id] = z.string().optional();
            break;
          default:
            // For info type questions, no validation needed
            break;
        }
      }
    });
  });
  
  return z.object(schemaFields);
}
