import WorkbookSubmissionModel, { IWorkbookSubmission } from '@/models/WorkbookSubmission';
import SubmissionModel, { ISubmission } from '@/models/Submission';
import FollowupAssessmentModel from '@/models/FollowupAssessment';
import { calculateImprovementScore } from '@/utils/followup/improvementScoreCalculator';
import { FollowupCategoryType } from '@/utils/followupUtils';
import { Document } from 'mongoose';

/**
 * Creates or updates a worksheet submission in the original workbook submission
 */
export async function createOrUpdateWorksheetSubmission(
  followupType: FollowupCategoryType,
  originalSubmission: Document & (IWorkbookSubmission | ISubmission),
  worksheetData: any,
  parsedAnswers: any,
  pillarId?: string
) {
  try {
    // Create a new worksheet submission object
    const worksheetSubmission = {
      worksheetId: worksheetData.worksheet.id,
      worksheetType: followupType,
      answers: parsedAnswers,
      submittedAt: new Date()
    };
    
    // Check if this is a workbook submission by looking for workbookId property
    const isWorkbookSubmission = 'workbookId' in originalSubmission;
    
    if (isWorkbookSubmission) {
      // This is a workbook submission
      const workbookSubmission = originalSubmission as Document & IWorkbookSubmission;
      
      // Update the original submission with the follow-up data
      if (followupType === 'pillar' && pillarId) {
        // For pillar follow-ups, add to the pillars array
        if (!workbookSubmission.pillars) {
          workbookSubmission.pillars = [];
        }
        workbookSubmission.pillars.push(worksheetSubmission);
      } else {
        // For workbook follow-ups, set as the followup field
        workbookSubmission.followup = worksheetSubmission;
      }
      
      await workbookSubmission.save();
      console.log(`Workbook submission updated with ${followupType} follow-up data`);
    } else {
      // This is a pillar worksheet submission
      const pillarSubmission = originalSubmission as Document & ISubmission;
      
      // For pillar worksheet submissions, we update the aiFeedback field
      // Parse existing aiFeedback if it's a JSON string, otherwise use an empty object
      let existingFeedback = {};
      if (pillarSubmission.aiFeedback) {
        try {
          // If it's a JSON string, parse it
          if (typeof pillarSubmission.aiFeedback === 'string') {
            existingFeedback = JSON.parse(pillarSubmission.aiFeedback);
          } else {
            // If it's already an object (might happen in runtime despite the type definition)
            existingFeedback = pillarSubmission.aiFeedback;
          }
        } catch (e) {
          console.warn('Could not parse aiFeedback as JSON, using empty object', e);
        }
      }
      
      // Create the new feedback object
      const newFeedback = {
        ...existingFeedback,
        followupAnswers: parsedAnswers,
        followupSubmittedAt: new Date()
      };
      
      // Store as a JSON string to match the interface definition
      pillarSubmission.aiFeedback = JSON.stringify(newFeedback);
      
      await pillarSubmission.save();
      console.log(`Pillar worksheet submission updated with follow-up data`);
    }
    
    return { success: true, originalSubmission };
  } catch (error) {
    console.error('Error updating original submission:', error);
    return { success: false, error };
  }
}

/**
 * Creates or updates a follow-up assessment document
 * Uses findOneAndUpdate with upsert to prevent duplicate key errors
 */
export async function createOrUpdateFollowupAssessment(
  user: { _id: string | any },
  originalSubmissionId: string,
  followupId: string,
  followupType: FollowupCategoryType,
  parsedAnswers: Record<string, any>,
  rawDiagnosisResponse: any,
  contextData: { worksheetTitle: string, [key: string]: any },
  worksheetData: { worksheet: { id: string, title: string }, [key: string]: any },
  pillarId?: string,
  timeElapsed?: string
) {
  try {
    const followupAssessment = await FollowupAssessmentModel.findOneAndUpdate(
      {
        workbookSubmissionId: originalSubmissionId,
        followupId
      },
      {
        userId: user._id,
        workbookSubmissionId: originalSubmissionId,
        followupId,
        followupType,
        status: 'completed',
        answers: parsedAnswers,
        diagnosis: rawDiagnosisResponse,
        diagnosisGeneratedAt: new Date(),
        completedAt: new Date(),
        metadata: {
          pillarId: pillarId || undefined,
          timeElapsed,
          originalTitle: contextData.worksheetTitle,
          followupTitle: worksheetData.worksheet?.title || followupId,
          improvementScore: calculateImprovementScore(rawDiagnosisResponse, followupType as FollowupCategoryType)
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );
    
    console.log(`Follow-up assessment saved/updated with ID: ${followupAssessment._id}`);
    return { success: true, followupAssessment };
  } catch (error: any) {
    console.error('Error creating/updating follow-up assessment:', error);
    
    // Handle duplicate key errors by attempting an update instead
    if (error.code === 11000) {
      try {
        console.log('Handling duplicate key error by attempting update only');
        const followupAssessment = await FollowupAssessmentModel.findOneAndUpdate(
          {
            workbookSubmissionId: originalSubmissionId,
            followupId
          },
          {
            status: 'completed',
            answers: parsedAnswers,
            diagnosis: rawDiagnosisResponse,
            diagnosisGeneratedAt: new Date(),
            completedAt: new Date(),
            metadata: {
              pillarId: pillarId || undefined,
              timeElapsed,
              originalTitle: contextData.worksheetTitle,
              followupTitle: worksheetData.worksheet?.title || followupId,
              improvementScore: calculateImprovementScore(rawDiagnosisResponse, followupType)
            }
          },
          {
            new: true,
            runValidators: true
          }
        );
        
        if (!followupAssessment) {
          throw new Error('Failed to update existing follow-up assessment');
        }
        
        return { success: true, followupAssessment };
      } catch (upsertError) {
        return { success: false, error: upsertError };
      }
    }
    
    return { success: false, error };
  }
}

/**
 * Updates the original submission with enhanced diagnosis data
 */
export async function updateOriginalSubmissionWithDiagnosis(
  originalSubmission: any,
  rawDiagnosisResponse: any,
  followupType: FollowupCategoryType
) {
  try {
    if (rawDiagnosisResponse && originalSubmission.diagnosis) {
      // Create a new diagnosis object with all required fields
      const updatedDiagnosis = {
        ...originalSubmission.diagnosis,
        // Update enhanced fields based on follow-up type
        situationAnalysis: rawDiagnosisResponse.situationAnalysis || originalSubmission.diagnosis.situationAnalysis,
        strengthsAnalysis: rawDiagnosisResponse.strengthsAnalysis || originalSubmission.diagnosis.strengthsAnalysis,
        growthAreasAnalysis: rawDiagnosisResponse.growthAreasAnalysis || originalSubmission.diagnosis.growthAreasAnalysis,
        actionableRecommendations: rawDiagnosisResponse.actionableRecommendations || originalSubmission.diagnosis.actionableRecommendations,
        pillarRecommendations: rawDiagnosisResponse.pillarRecommendations || originalSubmission.diagnosis.pillarRecommendations,
        followupRecommendation: rawDiagnosisResponse.followupRecommendation || originalSubmission.diagnosis.followupRecommendation
      };
      
      // Assign the updated diagnosis object
      originalSubmission.diagnosis = updatedDiagnosis;
      originalSubmission.diagnosisGeneratedAt = new Date();
      await originalSubmission.save();
      
      console.log(`Original submission updated with enhanced diagnosis for ${followupType} follow-up`);
      return { success: true };
    }
    return { success: false, error: 'No diagnosis data to update' };
  } catch (error) {
    console.error('Error updating original submission with diagnosis:', error);
    return { success: false, error };
  }
}
