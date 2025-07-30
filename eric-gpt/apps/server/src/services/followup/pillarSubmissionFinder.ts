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
  console.log(`Finding pillar submission for user ${userId} and pillar ${pillarId}`);
  
  // Find the most recent submission for this specific pillar by the user
  // Use SubmissionModel instead of WorkbookSubmissionModel for pillar submissions
  const pillarPattern = new RegExp(`^pillar${pillarId.replace(/[^0-9]/g, '')}`); // Extract pillar number
  
  const pillarSubmission = await SubmissionModel.findOne({
    userId,
    worksheetId: { $regex: pillarPattern } // Match pillar ID in worksheetId
  }).sort({ createdAt: -1 });
  
  if (pillarSubmission) {
    console.log(`Found pillar submission for ${pillarId}: ${pillarSubmission.worksheetId}`);
  } else {
    console.log(`No pillar submission found for ${pillarId}`);
  }
  
  return pillarSubmission;
}

/**
 * Prepares the submission context, looking up pillar-specific submissions if needed
 */
export async function prepareSubmissionContext(originalSubmission: any, followupType: FollowupCategoryType, pillarId: string | null, parsedAnswers: any) {
  const timeElapsed = calculateTimeElapsed(originalSubmission.createdAt || originalSubmission.submissionDate);
  console.log(`Time elapsed since original submission: ${timeElapsed}`);
  
  // For pillar follow-ups, always try to find the specific pillar submission first
  if (followupType === 'pillar' && pillarId) {
    console.log(`Looking up specific pillar submission for pillar ID: ${pillarId}`);
    
    // Get the user ID from the original submission
    const userId = originalSubmission.userId?.toString();
    if (!userId) {
      console.error('No userId found in original submission');
      // Continue with original submission as fallback
    } else {
      const pillarSubmission = await findPillarSubmission(userId, pillarId);
      
      if (pillarSubmission) {
        console.log(`Found specific pillar submission for ${pillarId}: ${pillarSubmission._id}`);
        console.log(`Using pillar submission with worksheetId: ${pillarSubmission.worksheetId}`);
        
        // Build context with the specific pillar submission data
        const contextData = buildFollowupContext(
          followupType,
          pillarSubmission,
          parsedAnswers,
          pillarId,
          timeElapsed
        );
        
        console.log('Context built with pillar-specific submission data');
        return { contextData, timeElapsed, pillarSubmission };
      } else {
        console.log(`No specific pillar submission found for ${pillarId}, using original submission as fallback`);
      }
    }
  }
  
  // If we get here, either it's not a pillar follow-up or we couldn't find a specific pillar submission
  // Build context data with the original submission
  console.log('Building context with original submission data');
  const contextData = buildFollowupContext(
    followupType,
    originalSubmission,
    parsedAnswers,
    pillarId || undefined,
    timeElapsed
  );
  
  return { contextData, timeElapsed };
}
