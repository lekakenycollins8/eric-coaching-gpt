import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateAIDiagnosis } from '@/utils/diagnosis/generator';
import { hasActiveSubscription } from '@/services/quotaManager';
import { connectToDatabase } from '@/db/connection';
import { emailService } from '@/services/emailService';
import WorkbookSubmissionModel, { IWorkbookSubmission } from '@/models/WorkbookSubmission';
import UserModel, { IUser } from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/workbook/submit:
 *   post:
 *     summary: Submit the completed Jackier Method Workbook
 *     description: Finalizes the workbook submission and triggers the AI diagnosis process
 *     tags:
 *       - Workbook
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workbookId:
 *                 type: string
 *                 description: ID of the workbook
 *                 example: jackier-method-workbook
 *               submissionId:
 *                 type: string
 *                 description: ID of the draft submission to finalize
 *               answers:
 *                 type: object
 *                 description: Final answers to the workbook questions (optional if submissionId is provided)
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Workbook submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 submissionId:
 *                   type: string
 *                   description: ID of the submitted workbook
 *                 diagnosisScheduled:
 *                   type: boolean
 *                   description: Whether the AI diagnosis has been scheduled
 *       400:
 *         description: Bad request - Missing required fields or incomplete workbook
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       404:
 *         description: Not found - Submission not found
 *       500:
 *         description: Server error
 */

/**
 * POST handler for submitting the completed workbook
 * Finalizes the submission and triggers the AI diagnosis process
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { workbookId, submissionId, answers, userId: bodyUserId } = body;
    
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

    // Check if user has an active subscription
    await connectToDatabase();
    const user = await UserModel.findById(userId);
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

    // Validate required fields
    if (!workbookId) {
      return NextResponse.json(
        { error: 'Missing required field: workbookId' },
        { status: 400 }
      );
    }
    let submission;

    // If submissionId is provided, find the existing draft
    if (submissionId) {
      submission = await WorkbookSubmissionModel.findOne({
        _id: submissionId,
        userId,
        workbookId
      }).exec();

      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }

      // Update answers if provided
      if (answers) {
        submission.answers = {
          ...submission.answers,
          ...answers
        };
      }
    } else {
      // If no submissionId, require answers
      if (!answers) {
        return NextResponse.json(
          { error: 'Missing required field: answers or submissionId' },
          { status: 400 }
        );
      }

      // Create new submission
      submission = new WorkbookSubmissionModel({
        userId,
        workbookId,
        status: 'draft',
        answers,
        emailSent: false,
        schedulingPrompted: false
      });
    }

    // Check if the submission has enough answers to be considered complete
    const answeredQuestions = Object.values(submission.answers || {})
      .filter(answer => answer !== null && answer !== undefined && answer !== '')
      .length;

    // Require at least 80% of questions to be answered
    // In a real implementation, you might want to check specific required questions
    if (answeredQuestions < 10) { // Assuming there are at least 12-15 important questions
      return NextResponse.json(
        { 
          error: 'Workbook is incomplete', 
          message: 'Please answer more questions before submitting' 
        },
        { status: 400 }
      );
    }

    // Update submission status to submitted
    submission.status = 'submitted';
    // Note: We don't need to set submittedAt explicitly as the updatedAt timestamp will be updated automatically
    
    // Save the submission
    await submission.save();

    // Generate the AI diagnosis based on the submitted answers
    try {
      console.log('Generating AI diagnosis for submission:', submission._id);
      
      // Format the answers for the diagnosis generation
      // Get the user's name or use a default
      const userName = user.name || 'Client';
      
      // Format each answer as a question-answer pair
      // In a real implementation, you would have a mapping of question IDs to actual question text
      let formattedAnswersText = '';
      
      Object.entries(submission.answers).forEach(([key, value]) => {
        // Skip empty answers
        if (value === null || value === undefined || value === '') return;
        
        // Format the question based on the key
        // This is a simplified example - in a real app, you'd have proper question text
        const question = key
          .replace(/_/g, ' ')
          .replace(/^(\w)/, (match) => match.toUpperCase())
          .replace(/section\d+/i, '');
        
        // Add formatted Q&A to the text
        formattedAnswersText += `Question: ${question}\nAnswer: ${String(value)}\n\n`;
      });
      
      console.log('Formatted answers text sample:', formattedAnswersText.substring(0, 200) + '...');
      
      // Generate the diagnosis
      const rawDiagnosisResponse = await generateAIDiagnosis(formattedAnswersText, userName);
      
      // Log the raw diagnosis response for debugging
      console.log('Raw AI diagnosis response:', JSON.stringify(rawDiagnosisResponse, null, 2));
      
      // Log enhanced fields for debugging
      console.log('Enhanced fields present in AI response:');
      console.log('- situationAnalysis:', rawDiagnosisResponse.situationAnalysis ? 'present' : 'missing');
      console.log('- strengthsAnalysis:', Array.isArray(rawDiagnosisResponse.strengthsAnalysis) ? `${rawDiagnosisResponse.strengthsAnalysis.length} items` : 'missing');
      console.log('- growthAreasAnalysis:', Array.isArray(rawDiagnosisResponse.growthAreasAnalysis) ? `${rawDiagnosisResponse.growthAreasAnalysis.length} items` : 'missing');
      console.log('- actionableRecommendations:', Array.isArray(rawDiagnosisResponse.actionableRecommendations) ? `${rawDiagnosisResponse.actionableRecommendations.length} items` : 'missing');
      console.log('- pillarRecommendations:', Array.isArray(rawDiagnosisResponse.pillarRecommendations) ? `${rawDiagnosisResponse.pillarRecommendations.length} items` : 'missing');
      console.log('- followupRecommendation:', rawDiagnosisResponse.followupRecommendation ? 'present' : 'missing');
      
      console.log('Prepared diagnosis object:', JSON.stringify({
        summary: rawDiagnosisResponse.summary,
        strengths: rawDiagnosisResponse.strengths,
        challenges: rawDiagnosisResponse.challenges,
        recommendations: rawDiagnosisResponse.recommendations,
        createdAt: new Date(),
        followupWorksheets: {
          pillars: Array.isArray(rawDiagnosisResponse.followupWorksheets.pillars) 
            ? rawDiagnosisResponse.followupWorksheets.pillars 
            : [],
          followup: rawDiagnosisResponse.followupWorksheets.followup || undefined
        },
        // Add enhanced analysis fields
        situationAnalysis: rawDiagnosisResponse.situationAnalysis,
        strengthsAnalysis: rawDiagnosisResponse.strengthsAnalysis,
        growthAreasAnalysis: rawDiagnosisResponse.growthAreasAnalysis,
        actionableRecommendations: rawDiagnosisResponse.actionableRecommendations,
        pillarRecommendations: rawDiagnosisResponse.pillarRecommendations,
        followupRecommendation: rawDiagnosisResponse.followupRecommendation
      }, null, 2));
      
      // Update the submission with the diagnosis
      // Add createdAt field required by IDiagnosisResult interface
      // Include all enhanced fields from the parser
      const diagnosis = {
        summary: rawDiagnosisResponse.summary,
        strengths: rawDiagnosisResponse.strengths,
        challenges: rawDiagnosisResponse.challenges,
        recommendations: rawDiagnosisResponse.recommendations,
        createdAt: new Date(),
        followupWorksheets: {
          pillars: Array.isArray(rawDiagnosisResponse.followupWorksheets?.pillars) 
            ? rawDiagnosisResponse.followupWorksheets.pillars 
            : [],
          followup: rawDiagnosisResponse.followupWorksheets?.followup || undefined
        },
        // Add enhanced analysis fields
        situationAnalysis: rawDiagnosisResponse.situationAnalysis,
        strengthsAnalysis: rawDiagnosisResponse.strengthsAnalysis,
        growthAreasAnalysis: rawDiagnosisResponse.growthAreasAnalysis,
        actionableRecommendations: rawDiagnosisResponse.actionableRecommendations,
        pillarRecommendations: rawDiagnosisResponse.pillarRecommendations,
        followupRecommendation: rawDiagnosisResponse.followupRecommendation
      };
      
      console.log('Prepared diagnosis object:', JSON.stringify(diagnosis, null, 2));
      
      submission.diagnosis = diagnosis;
      submission.diagnosisGeneratedAt = new Date();
      
      // Save the updated submission with diagnosis
      await submission.save();
      
      console.log('AI diagnosis generated successfully for submission:', submission._id);
      
      // Send email notification to the coach asynchronously (don't await)
      // This prevents delays in the API response
      setTimeout(async () => {
        try {
          // Get the user details for the email
          const userDetails = await UserModel.findById(submission.userId);
          
          if (userDetails) {
            const emailSent = await emailService.sendDiagnosisNotification(userDetails, submission);
            
            if (emailSent) {
              console.log('Diagnosis notification email sent successfully');
              
              // Update the emailSent flag in the submission
              submission.emailSent = true;
              await submission.save();
            } else {
              console.error('Failed to send diagnosis notification email');
            }
          } else {
            console.error('User not found for diagnosis notification email:', submission.userId);
          }
        } catch (emailError) {
          console.error('Error sending diagnosis notification email:', emailError);
          // Continue even if email sending fails
        }
      }, 100); // Small timeout to ensure this runs after the response is sent
    } catch (diagnosisError) {
      console.error('Error generating diagnosis:', diagnosisError);
      // Log more details about the error
      if (diagnosisError instanceof Error) {
        console.error('Error details:', diagnosisError.message);
        console.error('Error stack:', diagnosisError.stack);
      }
      // We'll continue even if diagnosis generation fails
      // The user can still submit the workbook, and we can generate the diagnosis later
    }

    return NextResponse.json({
      success: true,
      submissionId: submission._id,
      diagnosisGenerated: !!submission.diagnosisGeneratedAt
    }, { status: 200 });
  } catch (error) {
    console.error('Error submitting workbook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
