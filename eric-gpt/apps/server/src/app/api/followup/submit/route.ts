import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { hasActiveSubscription } from '@/services/quotaManager';
import WorkbookSubmissionModel, { IDiagnosisResult, IFollowupWorksheets } from '@/models/WorkbookSubmission';
import FollowupAssessmentModel from '@/models/FollowupAssessment';
import UserModel from '@/models/User';
import mongoose from 'mongoose';
import { 
  loadFollowupById, 
  validateFollowupAnswers, 
  getFollowupType, 
  loadFollowupContext,
  extractPillarId,
  FollowupCategoryType 
} from '@/utils/followupUtils';
import { generateFollowupDiagnosis, FollowupDiagnosisResponse } from '@/utils/diagnosis/followupDiagnosis';
import { buildFollowupContext } from '@/utils/followup/contextBuilder';
import { parseFormattedAnswers, formatAnswers } from '@/utils/followup/answerFormatter';
import { convertToDatabaseFormat } from '@/utils/followup/diagnosisConverter';
import { calculateTimeElapsed } from '@/utils/followup/timeUtils';
import { sendFollowupCompletionEmail } from '@/utils/followup/emailNotifier';
import { calculateImprovementScore } from '@/utils/followup/improvementScoreCalculator';

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
/**
 * Helper function to extract a section from the AI-generated text
 * @param text The full AI-generated text
 * @param sectionTitle The title of the section to extract
 * @param nextSectionTitle Optional title of the next section to determine the end
 * @returns The extracted section content
 */
function extractSection(text: string, sectionTitle: string, nextSectionTitle?: string): string {
  // Create regex patterns for the section headers
  const sectionPattern = new RegExp(`##\s*${sectionTitle}\s*\n`, 'i');
  const nextSectionPattern = nextSectionTitle ? 
    new RegExp(`##\s*${nextSectionTitle}\s*\n`, 'i') : 
    /##\s*[A-Z\s]+\s*\n/i;
  
  // Find the start of the section
  const sectionMatch = text.match(sectionPattern);
  if (!sectionMatch) return '';
  
  const sectionStart = sectionMatch.index! + sectionMatch[0].length;
  
  // Find the start of the next section
  let sectionEnd = text.length;
  const nextSectionMatch = text.slice(sectionStart).match(nextSectionPattern);
  
  if (nextSectionMatch) {
    sectionEnd = sectionStart + nextSectionMatch.index!;
  }
  
  // Extract and return the section content
  return text.slice(sectionStart, sectionEnd).trim();
}

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
        { error: 'Missing required fields: followupId, originalSubmissionId, and answers are required' },
        { status: 400 }
      );
    }

    // Try to authenticate via session first
    const session = await getServerSession(authOptions);
    let userId;
    
    // If session exists, use the user ID from the session
    if (session && session.user) {
      userId = session.user.id;
    } 
    // Otherwise, check if userId was provided in the request body
    else if (bodyUserId) {
      userId = bodyUserId;
      console.log(`Using userId from request body for authentication: ${bodyUserId}`);
    } 
    // If no authentication method worked, return 401
    else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to database and verify user
    await connectToDatabase();
    const user = await UserModel.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has an active subscription
    const validStatuses = ['active', 'past_due'];
    if (!user.subscription || !validStatuses.includes(user.subscription.status)) {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      );
    }

    // Check if user has quota available
    const hasQuota = await hasActiveSubscription(userId);
    if (!hasQuota) {
      return NextResponse.json(
        { error: 'Subscription quota exceeded' },
        { status: 403 }
      );
    }

    // Verify that the original submission exists
    const originalSubmission = await WorkbookSubmissionModel.findById(originalSubmissionId);
    if (!originalSubmission) {
      return NextResponse.json(
        { error: 'Original submission not found' },
        { status: 404 }
      );
    }

    // Verify that the submission belongs to the authenticated user
    if (originalSubmission.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to submission' },
        { status: 403 }
      );
    }

    // Verify that the follow-up worksheet exists
    let followupWorksheetExists = false;
    // Determine the follow-up type using our new utility function
    const followupType: FollowupCategoryType = getFollowupType(followupId);
    // Extract pillar ID if this is a pillar follow-up
    const pillarId = followupType === 'pillar' ? extractPillarId(followupId) : null;
    
    console.log(`Follow-up type determined: ${followupType}${pillarId ? ', Pillar ID: ' + pillarId : ''}`);
    
    // Define worksheet variable outside the try block so it's available in the entire scope
    let worksheetData: { worksheet: any; type: string | null } = { worksheet: null, type: null };
    
    try {
      // Load the follow-up worksheet to determine its type
      worksheetData = await loadFollowupById(followupId);
      
      if (!worksheetData.worksheet) {
        return NextResponse.json(
          { error: 'Follow-up worksheet not found' },
          { status: 404 }
        );
      }
      followupWorksheetExists = true;
    } catch (error) {
      console.error('Error checking follow-up worksheet existence:', error);
    }

    // We'll create the follow-up assessment document after generating the diagnosis

    // Format the answers for the prompt
    const formattedAnswers = Object.entries(answers)
      .map(([key, value]) => `Question: ${key}\nAnswer: ${value}`)
      .join('\n\n');
    
    // Parse the formatted answers using our utility
    const parsedAnswers = parseFormattedAnswers(formattedAnswers);
    
    // Calculate time elapsed since original submission
    const timeElapsed = calculateTimeElapsed(originalSubmission.createdAt);
    
    // Update the original submission with the follow-up reference
    const worksheetSubmission = {
      worksheetId: followupId,
      answers: parsedAnswers, // Store the parsed answers for consistency
      submittedAt: new Date()
    };

    // Update the original submission with the follow-up data based on follow-up type
    if (followupType === 'pillar') {
      // For pillar follow-ups, add to the pillars array
      if (!originalSubmission.pillars) {
        originalSubmission.pillars = [];
      }
      originalSubmission.pillars.push(worksheetSubmission);
    } else {
      // For workbook follow-ups, set as the followup field
      originalSubmission.followup = worksheetSubmission;
    }

    await originalSubmission.save();
    console.log(`Original submission updated with ${followupType} follow-up data`);

    // Generate enhanced AI diagnosis with context from both submissions
    try {
      console.log('Generating enhanced AI diagnosis for follow-up submission');
      
      // Build context data for follow-up diagnosis using our context builder utility
      const contextData = buildFollowupContext(
        followupType,
        originalSubmission,
        parsedAnswers, // Use the parsed answers object
        pillarId || undefined, // Convert null to undefined to satisfy TypeScript
        timeElapsed
      );
      
      // Log the type of follow-up for debugging
      console.log(`Processing ${followupType} follow-up submission${pillarId ? `, Pillar ID: ${pillarId}` : ''}`);
      
      // Generate the follow-up diagnosis with the appropriate prompt based on follow-up type
      const diagnosisResponse = await generateFollowupDiagnosis(followupType, contextData);
      
      console.log(`Generated ${followupType} follow-up diagnosis`);
      
      // Convert the diagnosis response to the database format using our converter utility
      const rawDiagnosisResponse = convertToDatabaseFormat(diagnosisResponse, followupType);
      
      console.log('Enhanced AI diagnosis generated successfully');
      
      // Create the follow-up assessment document with type-specific fields
      followupAssessment = new FollowupAssessmentModel({
        userId: user._id,
        workbookSubmissionId: originalSubmissionId,
        followupId,
        followupType, // Using our new explicit followupType field
        status: 'completed',
        answers: parsedAnswers,
        diagnosis: rawDiagnosisResponse,
        diagnosisGeneratedAt: new Date(),
        completedAt: new Date(),
        // Add structured metadata using our new IFollowupMetadata interface
        metadata: {
          pillarId: pillarId || undefined, // Only for pillar follow-ups
          timeElapsed,
          originalTitle: contextData.worksheetTitle,
          followupTitle: worksheetData.worksheet?.title || followupId,
          improvementScore: calculateImprovementScore(rawDiagnosisResponse, followupType)
        }
      });
      
      // Save the follow-up assessment to the database
      await followupAssessment.save();
      console.log(`Follow-up assessment saved with ID: ${followupAssessment._id}`);
      
      // Update the original submission with the enhanced diagnosis
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
      }
    } catch (diagnosisError) {
      console.error('Error generating enhanced diagnosis:', diagnosisError);
      // Continue even if diagnosis generation fails
    }

    // Send email notification asynchronously
    try {
      // Only send email if followupAssessment was successfully created
      if (followupAssessment) {
        // Send notification email about the follow-up submission using our modular utility
        await sendFollowupCompletionEmail(
          user,
          originalSubmission,
          followupAssessment,
          needsHelp,
          followupType
        );
        
        console.log(`${followupType.charAt(0).toUpperCase() + followupType.slice(1)} follow-up submission notification email sent successfully`);
      } else {
        console.warn('Skipping email notification as followupAssessment was not created');
      }
    } catch (emailError) {
      console.error('Error sending follow-up notification email:', emailError);
      // Continue even if email sending fails
    }

    return NextResponse.json({
      success: true,
      followupId: followupAssessment ? followupAssessment._id.toString() : null,
      followupType,
      originalSubmissionUpdated: true
    }, { status: 200 });
  } catch (error) {
    console.error('Error submitting follow-up worksheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
