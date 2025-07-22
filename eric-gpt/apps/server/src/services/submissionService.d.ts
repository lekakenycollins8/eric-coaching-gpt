/**
 * Type declarations for the submission service
 */

export function getSubmissionsByUserId(userId: string): Promise<any[]>;
export function getSubmissionById(submissionId: string): Promise<any | null>;
export function getSubmissionsByWorksheetId(worksheetId: string): Promise<any[]>;
export function getCompletedSubmissionsByUserId(userId: string): Promise<any[]>;
export function createSubmission(submissionData: any): Promise<any>;
export function updateSubmission(submissionId: string, updateData: any): Promise<any | null>;
