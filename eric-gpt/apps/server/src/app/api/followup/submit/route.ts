import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import { Document } from 'mongoose';
import SubmissionModel, { ISubmission } from '@/models/Submission';
import WorkbookSubmissionModel, { IWorkbookSubmission } from '@/models/WorkbookSubmission';
import { 
  authenticateAndValidateUser, 
  loadAndValidateWorksheet, 
  findOriginalSubmission, 
  prepareSubmissionContext, 
  generateAndFormatDiagnosis, 
  createOrUpdateWorksheetSubmission, 
  createOrUpdateFollowupAssessment, 
  sendNotificationEmail, 
  formatSuccessResponse, 
  formatErrorResponse 
} from '@/services/followup';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/followup/submit:
 *   post:
 *     summary: Submit a follow-up worksheet
 *     description: Submits a follow-up worksheet and links it to the original workbook submission
 *     tags:
 *       - Followup
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followupId:
 *                 type: string
 *                 description: ID of the follow-up worksheet
 *                 example: pillar1-followup
 *               originalSubmissionId:
 *                 type: string
 *                 description: ID of the original workbook submission
 *               answers:
 *                 type: object
 *                 description: User's answers to the follow-up questions
 *                 additionalProperties: true
 *               needsHelp:
 *                 type: boolean
 *                 description: Whether the user has requested help from a coach
 *                 default: false
 *     responses:
 *       200:
 *         description: Follow-up worksheet submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 followupId:
 *                   type: string
 *                   description: ID of the submitted follow-up
 *                 originalSubmissionUpdated:
 *                   type: boolean
 *                   description: Whether the original submission was updated with the follow-up
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       404:
 *         description: Not found - Original submission not found
 *       500:
 *         description: Server error
 */

/**
 * POST handler for submitting a follow-up worksheet
 * Links the follow-up to the original workbook submission and sends notification emails
 */
export async function POST(request: Request) {
  // Define followupAssessment at the top level of the function scope
  let followupAssessment: any = null;
  
  try {
    // Parse request body
    const body = await request.json();
    const { followupId, originalSubmissionId, answers, needsHelp = false, userId: bodyUserId } = body;
    
    // Validate required fields
    if (!followupId || !originalSubmissionId || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: followupId, originalSubmissionId, or answers' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Step 1: Authenticate and validate the user
    const { error: authError, user } = await authenticateAndValidateUser(request, bodyUserId);
    if (authError) return authError;
    
    // Step 2: Load and validate the worksheet
    const { error: worksheetError, status: worksheetStatus, data: worksheetData } = 
      await loadAndValidateWorksheet(followupId, answers);
    
    if (worksheetError) {
      return NextResponse.json({ error: worksheetError }, { status: worksheetStatus });
    }
    
    const { worksheetData: loadedWorksheetData, followupType, pillarId, parsedAnswers } = worksheetData!;
    
    console.log(`Processing ${followupType} follow-up submission${pillarId ? ` for pillar ${pillarId}` : ''}`);
    
    // Step 3: Find the original submission
    console.log(`Looking for original submission with ID: ${originalSubmissionId}`);
    const originalSubmission = await findOriginalSubmission(originalSubmissionId, user._id.toString()) as Document & (ISubmission | IWorkbookSubmission);
    
    if (!originalSubmission) {
      return NextResponse.json(
        { error: 'Original workbook submission not found' },
        { status: 404 }
      );
    }
    
    console.log(`Found original submission with ID: ${originalSubmission._id}`);
    // Log some details about the submission to help with debugging
    // Handle both workbook submissions and pillar worksheet submissions
    // Check if this is a workbook submission by looking for workbookId property
    const isWorkbookSubmission = 'workbookId' in originalSubmission;
    
    if (isWorkbookSubmission) {
      // This is a workbook submission
      const workbookSubmission = originalSubmission as Document & IWorkbookSubmission;
      console.log(`Workbook ID: ${workbookSubmission.workbookId || 'unknown'}`);
      console.log(`Has diagnosis: ${!!workbookSubmission.diagnosis}`);
      console.log(`Has pillars: ${Array.isArray(workbookSubmission.pillars) && workbookSubmission.pillars.length > 0}`);
      console.log(`Has followup: ${!!workbookSubmission.followup}`);
    } else {
      // This is a pillar worksheet submission
      const pillarSubmission = originalSubmission as Document & ISubmission;
      console.log(`Pillar worksheet ID: ${pillarSubmission.worksheetId || 'unknown'}`);
      console.log(`Pillar worksheet title: ${pillarSubmission.worksheetTitle || 'unknown'}`);
      console.log(`Has AI feedback: ${!!pillarSubmission.aiFeedback}`);
    }
    console.log(`Submission date: ${originalSubmission.createdAt}`);
    
    // Step 4: Create or update the worksheet submission in the original submission
    const { success: worksheetUpdateSuccess, error: worksheetUpdateError } = 
      await createOrUpdateWorksheetSubmission(
        followupType,
        originalSubmission,
        loadedWorksheetData,
        parsedAnswers,
        pillarId || undefined
      );
    
    if (!worksheetUpdateSuccess) {
      return formatErrorResponse(worksheetUpdateError);
    }
    
    // Step 5: Prepare the submission context with pillar-specific lookup if needed
    const { contextData, timeElapsed } = await prepareSubmissionContext(
      originalSubmission,
      followupType,
      pillarId || null,
      parsedAnswers
    );
    
    // Step 6: Generate enhanced AI diagnosis
    const { success: diagnosisSuccess, diagnosisResponse, rawDiagnosisResponse, error: diagnosisError } = 
      await generateAndFormatDiagnosis(followupType, contextData);
    
    // Step 7: Create or update the follow-up assessment document
    if (diagnosisSuccess && rawDiagnosisResponse) {
      const { success: assessmentSuccess, followupAssessment: createdAssessment, error: assessmentError } = 
        await createOrUpdateFollowupAssessment(
          user,
          originalSubmissionId,
          followupId,
          followupType,
          parsedAnswers,
          rawDiagnosisResponse,
          contextData,
          loadedWorksheetData,
          pillarId || undefined,
          timeElapsed
        );
      
      if (assessmentSuccess) {
        followupAssessment = createdAssessment;
        
        // Original submission is only used as context, no need to update it
      } else {
        console.error('Error creating/updating follow-up assessment:', assessmentError);
      }
    } else {
      console.error('Error generating diagnosis:', diagnosisError);
    }
    
    // Step 9: Send email notification asynchronously
    if (followupAssessment) {
      await sendNotificationEmail(
        user,
        originalSubmission,
        followupAssessment,
        needsHelp,
        followupType
      );
    }
    
    // Step 10: Return success response
    return formatSuccessResponse(followupAssessment, followupType);
  } catch (error) {
    return formatErrorResponse(error);
  }
}
