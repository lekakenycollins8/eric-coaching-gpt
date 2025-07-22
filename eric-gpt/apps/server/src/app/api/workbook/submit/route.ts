import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'
import User, { IUser } from '@/models/User';
import WorkbookSubmission, { IWorkbookSubmission } from '@/models/WorkbookSubmission';
import mongoose from 'mongoose';
import { generateAIDiagnosis, FormattedQA } from '@/utils/diagnosisUtils';
import { hasActiveSubscription } from '@/services/quotaManager';
import worksheetRelationshipService from '@/services/worksheetRelationshipService';
import { connectToDatabase } from '@/db/connection';

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
    const user = await User.findById(userId);
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
      submission = await WorkbookSubmission.findOne({
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
      submission = new WorkbookSubmission({
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
      const formattedAnswers: FormattedQA[] = [];
      
      // Get the user's name or use a default
      const userName = user.name || 'Client';
      
      // Format each answer as a question-answer pair
      // In a real implementation, you would have a mapping of question IDs to actual question text
      Object.entries(submission.answers).forEach(([key, value]) => {
        // Skip empty answers
        if (value === null || value === undefined || value === '') return;
        
        // Format the question based on the key
        // This is a simplified example - in a real app, you'd have proper question text
        const question = key
          .replace(/_/g, ' ')
          .replace(/^(\w)/, (match) => match.toUpperCase())
          .replace(/section\d+/i, '');
        
        formattedAnswers.push({
          question,
          answer: String(value)
        });
      });
      
      // Generate the diagnosis
      const diagnosisResponse = await generateAIDiagnosis(formattedAnswers, userName);
      
      // Update the submission with the diagnosis
      // Add createdAt field required by IDiagnosisResult interface
      // Ensure followupWorksheets.followup is a string or undefined (not null) to match schema
      const diagnosis = {
        summary: diagnosisResponse.summary,
        strengths: diagnosisResponse.strengths,
        challenges: diagnosisResponse.challenges,
        recommendations: diagnosisResponse.recommendations,
        createdAt: new Date(),
        followupWorksheets: {
          pillars: Array.isArray(diagnosisResponse.followupWorksheets.pillars) 
            ? diagnosisResponse.followupWorksheets.pillars 
            : []
        }
      };
      
      console.log('Prepared diagnosis object:', JSON.stringify(diagnosis, null, 2));
      
      submission.diagnosis = diagnosis;
      submission.diagnosisGeneratedAt = new Date();
      
      // Save the updated submission with diagnosis
      await submission.save();
      
      console.log('AI diagnosis generated successfully for submission:', submission._id);
      
      // Generate worksheet recommendations with AI context
      try {
        console.log('Generating worksheet recommendations with AI context...');
        
        // Get recommended worksheets based on the diagnosis
        const recommendedWorksheets = await worksheetRelationshipService.getRecommendedFollowUps(
          'jackier_method', // Source worksheet ID for Jackier Method
          formattedAnswers,
          diagnosis.challenges
        );
        
        console.log(`Generated ${recommendedWorksheets.length} worksheet recommendations with AI context`);
        
        // Store the recommendations in the submission document
        // First check if the schema supports worksheetRecommendations
        if (!submission.worksheetRecommendations) {
          // Add worksheetRecommendations as a custom property if not in schema
          (submission as any).worksheetRecommendations = recommendedWorksheets;
        } else {
          submission.worksheetRecommendations = recommendedWorksheets;
        }
        
        await submission.save();
        
        console.log('Worksheet recommendations stored in submission document');
      } catch (recommendationsError) {
        console.error('Error generating worksheet recommendations:', recommendationsError);
        // Continue even if recommendations generation fails
      }
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
