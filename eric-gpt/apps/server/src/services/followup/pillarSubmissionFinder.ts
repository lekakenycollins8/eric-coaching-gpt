import WorkbookSubmissionModel from '@/models/WorkbookSubmission';
import SubmissionModel from '@/models/Submission';
import { buildFollowupContext } from '@/utils/followup/contextBuilder';
import { calculateTimeElapsed } from '@/utils/followup/timeUtils';
import { FollowupCategoryType } from '@/utils/followupUtils';

/**
 * Finds the original submission by ID or submissionId
 */
export async function findOriginalSubmission(originalSubmissionId: string, userId: string) {
  console.log(`Finding original submission with ID: ${originalSubmissionId} for user: ${userId}`);
  
  // Check if this is a pillar worksheet ID (e.g., pillar1_leadership_mindset)
  const isPillarWorksheet = /^pillar\d+/.test(originalSubmissionId);
  
  if (isPillarWorksheet) {
    console.log(`Looking for pillar worksheet submission with ID: ${originalSubmissionId}`);
    
    // Try to find the pillar worksheet submission
    let pillarSubmission = await SubmissionModel.findOne({
      worksheetId: originalSubmissionId,
      userId
    });
    
    if (pillarSubmission) {
      console.log(`Found pillar worksheet submission for worksheetId: ${originalSubmissionId}`);
      return pillarSubmission;
    }
    
    // If not found by exact ID, try to find any submission for this pillar
    const pillarNumber = originalSubmissionId.match(/pillar(\d+)/)?.[1];
    if (pillarNumber) {
      const pillarPattern = new RegExp(`^pillar${pillarNumber}`);
      pillarSubmission = await SubmissionModel.findOne({
        worksheetId: { $regex: pillarPattern },
        userId
      }).sort({ createdAt: -1 });
      
      if (pillarSubmission) {
        console.log(`Found pillar worksheet submission for pillar ${pillarNumber}: ${pillarSubmission.worksheetId}`);
        return pillarSubmission;
      }
    }
  }
  
  // If not a pillar worksheet or pillar submission not found, try workbook submission
  console.log(`Looking for workbook submission with ID: ${originalSubmissionId}`);
  
  // Try to find by _id first
  let originalSubmission = await WorkbookSubmissionModel.findOne({
    _id: originalSubmissionId,
    userId
  });
  
  if (originalSubmission) {
    console.log(`Found workbook submission by _id with userId constraint`);
    return originalSubmission;
  }
  
  // If not found, try by submissionId
  originalSubmission = await WorkbookSubmissionModel.findOne({
    submissionId: originalSubmissionId,
    userId
  });
  
  if (originalSubmission) {
    console.log(`Found workbook submission by submissionId with userId constraint`);
    return originalSubmission;
  }
  
  // Try to find the most recent submission for this user if specific ID not found
  console.log(`Workbook submission not found with ID ${originalSubmissionId}, looking for most recent submission`);
  originalSubmission = await WorkbookSubmissionModel.findOne({
    userId
  }).sort({ createdAt: -1 });
  
  if (originalSubmission) {
    console.log(`Found most recent workbook submission for user: ${originalSubmission._id}`);
    return originalSubmission;
  }
  
  // Final attempt without userId constraint
  originalSubmission = await WorkbookSubmissionModel.findOne({ 
    $or: [
      { _id: originalSubmissionId },
      { submissionId: originalSubmissionId }
    ]
  });
  
  if (originalSubmission) {
    console.log(`Found workbook submission without userId constraint`);
  }
  
  return originalSubmission;
}

/**
 * Finds a pillar-specific submission
 */
export async function findPillarSubmission(userId: string, pillarId: string) {
  // Find the most recent submission for this specific pillar by the user
  const pillarSubmission = await WorkbookSubmissionModel.findOne({
    userId,
    'metadata.worksheetType': { $regex: new RegExp(pillarId, 'i') } // Case-insensitive match for pillar ID
  }).sort({ createdAt: -1 });
  
  return pillarSubmission;
}

/**
 * Prepares the submission context, looking up pillar-specific submissions if needed
 */
export async function prepareSubmissionContext(originalSubmission: any, followupType: FollowupCategoryType, pillarId: string | null, parsedAnswers: any) {
  const timeElapsed = calculateTimeElapsed(originalSubmission.submissionDate);
  
  // Build initial context data for follow-up diagnosis
  let contextData = buildFollowupContext(
    followupType,
    originalSubmission,
    parsedAnswers,
    pillarId || undefined,
    timeElapsed
  );
  
  // For pillar follow-ups, check if we need to look up a separate pillar submission
  if (followupType === 'pillar' && pillarId && contextData.needsPillarSubmissionLookup) {
    console.log(`Looking up specific pillar submission for pillar ID: ${pillarId}`);
    
    const pillarSubmission = await findPillarSubmission(originalSubmission.userId, pillarId);
    
    if (pillarSubmission) {
      console.log(`Found specific pillar submission for ${pillarId}: ${pillarSubmission._id}`);
      
      // Rebuild context with the specific pillar submission data
      contextData = buildFollowupContext(
        followupType,
        pillarSubmission,
        parsedAnswers,
        pillarId,
        timeElapsed
      );
      
      console.log('Context rebuilt with pillar-specific submission data');
    } else {
      console.log(`No specific pillar submission found for ${pillarId}, using workbook data as fallback`);
    }
  }
  
  return { contextData, timeElapsed };
}
