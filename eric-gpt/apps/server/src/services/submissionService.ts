import mongoose from 'mongoose';
import { connectToDatabase } from '../db/connection';
import { Collections } from '../db/config';

/**
 * Get all submissions for a specific user
 * @param userId The user ID to get submissions for
 * @returns Array of submission documents
 */
export async function getSubmissionsByUserId(userId: string) {
  try {
    await connectToDatabase();
    
    // Get the Submission collection
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    const submissionsCollection = db.collection(Collections.WORKSHEET_SUBMISSIONS);
    
    // Query for submissions by this user
    const submissions = await submissionsCollection
      .find({ userId: userId })
      .toArray();
    
    return submissions;
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return [];
  }
}

/**
 * Get a specific submission by its ID
 * @param submissionId The submission ID to retrieve
 * @returns The submission document or null if not found
 */
export async function getSubmissionById(submissionId: string) {
  try {
    await connectToDatabase();
    
    // Get the Submission collection
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    const submissionsCollection = db.collection(Collections.WORKSHEET_SUBMISSIONS);
    
    // Query for the specific submission
    const submission = await submissionsCollection.findOne({
      _id: new mongoose.Types.ObjectId(submissionId)
    });
    
    return submission;
  } catch (error) {
    console.error('Error fetching submission by ID:', error);
    return null;
  }
}

/**
 * Get submissions for a specific worksheet
 * @param worksheetId The worksheet ID to get submissions for
 * @returns Array of submission documents
 */
export async function getSubmissionsByWorksheetId(worksheetId: string) {
  try {
    await connectToDatabase();
    
    // Get the Submission collection
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    const submissionsCollection = db.collection(Collections.WORKSHEET_SUBMISSIONS);
    
    // Query for submissions for this worksheet
    const submissions = await submissionsCollection
      .find({ worksheetId: worksheetId })
      .toArray();
    
    return submissions;
  } catch (error) {
    console.error('Error fetching worksheet submissions:', error);
    return [];
  }
}

/**
 * Get completed submissions for a specific user
 * @param userId The user ID to get completed submissions for
 * @returns Array of completed submission documents
 */
export async function getCompletedSubmissionsByUserId(userId: string) {
  try {
    await connectToDatabase();
    
    // Get the Submission collection
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    const submissionsCollection = db.collection(Collections.WORKSHEET_SUBMISSIONS);
    
    // Query for completed submissions by this user
    const submissions = await submissionsCollection
      .find({ 
        userId: userId,
        status: 'completed'
      })
      .toArray();
    
    return submissions;
  } catch (error) {
    console.error('Error fetching completed user submissions:', error);
    return [];
  }
}

/**
 * Create a new submission
 * @param submissionData The submission data to create
 * @returns The created submission document
 */
export async function createSubmission(submissionData: any) {
  try {
    await connectToDatabase();
    
    // Get the Submission collection
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    const submissionsCollection = db.collection(Collections.WORKSHEET_SUBMISSIONS);
    
    // Add timestamps
    const now = new Date();
    const submission = {
      ...submissionData,
      createdAt: now,
      updatedAt: now
    };
    
    // Insert the submission
    const result = await submissionsCollection.insertOne(submission);
    
    return {
      _id: result.insertedId,
      ...submission
    };
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
}

/**
 * Update an existing submission
 * @param submissionId The ID of the submission to update
 * @param updateData The data to update
 * @returns The updated submission document
 */
export async function updateSubmission(submissionId: string, updateData: any) {
  try {
    await connectToDatabase();
    
    // Get the Submission collection
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    const submissionsCollection = db.collection(Collections.WORKSHEET_SUBMISSIONS);
    
    // Add updated timestamp
    const update = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // Update the submission
    await submissionsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(submissionId) },
      { $set: update }
    );
    
    // Return the updated document
    return getSubmissionById(submissionId);
  } catch (error) {
    console.error('Error updating submission:', error);
    throw error;
  }
}
