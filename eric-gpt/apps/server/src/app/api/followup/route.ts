import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/models';
import { IUser } from '@/models/User';
import WorkbookSubmission, { IWorkbookSubmission, IWorksheetSubmission } from '@/models/WorkbookSubmission';
import { FollowupAssessment, IFollowupAssessment } from '@/models/FollowupAssessment';
import mongoose, { Document } from 'mongoose';
import { loadWorksheet, validateFollowupAnswers, PILLAR_TYPES, FOLLOWUP_TYPES, PillarType, FollowupType, WorksheetType } from '@/utils/followupUtils';
import { emailService } from '@/services/emailService';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/followup:
 *   get:
 *     summary: Get a follow-up worksheet based on diagnosis
 *     description: Retrieves a follow-up worksheet recommended by the AI diagnosis
 *     tags:
 *       - Workbook
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: submissionId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the workbook submission with diagnosis
 *     responses:
 *       200:
 *         description: Follow-up worksheet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 worksheet:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           text:
 *                             type: string
 *                           type:
 *                             type: string
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       404:
 *         description: Not found - Submission or worksheet not found
 *       500:
 *         description: Server error
 */

/**
 * GET handler for retrieving a follow-up worksheet
 * Returns the follow-up worksheet recommended by the AI diagnosis
 */
export async function GET(request: Request) {
  try {
    // Get the submission ID from the query parameters
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the submission
    const submission = await WorkbookSubmission.findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Get the authenticated user from session or query parameter
    let userId;
    
    // First try to get userId from the session
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // If no session, try to get userId from query parameters (for web app proxy requests)
      userId = searchParams.get('userId');
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    // Check if the submission belongs to the user
    if (submission.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if the submission has a diagnosis with follow-up recommendations
    if (!submission.diagnosis?.followupWorksheets) {
      return NextResponse.json(
        { error: 'No follow-up worksheets recommended' },
        { status: 404 }
      );
    }

    // Get the recommended pillar worksheets
    const { pillars = [] } = submission.diagnosis.followupWorksheets;
    
    // Check if we have any worksheet recommendations
    if (pillars.length === 0) {
      return NextResponse.json(
        { error: 'No worksheets recommended' },
        { status: 404 }
      );
    }

    // Get the worksheet type from the query parameters
    const worksheetType = searchParams.get('type') || 'followup';
    const worksheetId = searchParams.get('worksheetId');
    
    let targetWorksheetId;
    
    if (worksheetType === 'pillar') {
      // For pillar worksheets, use the provided ID or the first recommended pillar
      if (worksheetId && pillars.includes(worksheetId as any)) {
        targetWorksheetId = worksheetId;
      } else if (pillars.length > 0) {
        targetWorksheetId = pillars[0];
      } else {
        return NextResponse.json(
          { error: 'No pillar worksheets recommended' },
          { status: 404 }
        );
      }
    } else {
      // For follow-up worksheets, use the provided ID or check if we have implementation follow-ups
      targetWorksheetId = worksheetId;
      
      // If no specific worksheet ID was provided, we need to determine which follow-up to use
      // This would typically come from the implementation-support-followup.json file
      if (!targetWorksheetId) {
        return NextResponse.json(
          { error: 'No follow-up worksheet recommended' },
          { status: 404 }
        );
      }
    }

    // Load the worksheet
    const worksheet = await loadWorksheet(targetWorksheetId as WorksheetType);
    if (!worksheet) {
      return NextResponse.json(
        { error: 'Worksheet not found' },
        { status: 404 }
      );
    }

    // Check if the user has already completed this worksheet
    let existingAnswers = {};
    let submittedAt = null;
    
    if (worksheetType === 'pillar' && submission.pillars && submission.pillars.length > 0) {
      const existingPillar = submission.pillars.find(
        (p: IWorksheetSubmission) => p.worksheetId === targetWorksheetId
      );
      if (existingPillar) {
        existingAnswers = existingPillar.answers;
        submittedAt = existingPillar.submittedAt;
      }
    } else if (worksheetType === 'followup' && submission.followup?.worksheetId === targetWorksheetId) {
      existingAnswers = submission.followup.answers;
      submittedAt = submission.followup.submittedAt;
    }

    // Return the worksheet with any existing answers
    return NextResponse.json({
      worksheet,
      existingAnswers,
      submittedAt,
      worksheetType,
      recommendedPillars: pillars
    });
  } catch (error) {
    console.error('Error retrieving follow-up worksheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/followup:
 *   post:
 *     summary: Submit a completed follow-up worksheet
 *     description: Saves the user's answers to a follow-up worksheet
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
 *             required:
 *               - submissionId
 *               - worksheetId
 *               - answers
 *             properties:
 *               submissionId:
 *                 type: string
 *                 description: ID of the original workbook submission
 *               worksheetId:
 *                 type: string
 *                 description: ID of the follow-up worksheet
 *               answers:
 *                 type: object
 *                 description: Key-value pairs of question IDs and answers
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
 *       400:
 *         description: Bad request - Missing required fields or invalid answers
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       404:
 *         description: Not found - Submission or worksheet not found
 *       500:
 *         description: Server error
 */

/**
 * POST handler for submitting a completed follow-up worksheet
 * Saves the user's answers to a follow-up worksheet
 */
export async function POST(request: Request) {
  try {
    // Parse request body first to get potential userId
    const body = await request.json();
    const { submissionId, worksheetId, answers, needsHelp, userId: bodyUserId } = body;
    
    // Get the authenticated user from session or request body
    let userId;
    
    // First try to get userId from the session
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else if (bodyUserId) {
      // If no session, try to get userId from request body (for web app proxy requests)
      userId = bodyUserId;
    } else {
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
    if (!submissionId || !worksheetId || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, worksheetId, or answers' },
        { status: 400 }
      );
    }

    // Find the original submission
    const submission = await WorkbookSubmission.findOne({
      _id: submissionId,
      userId: userId, // Use userId variable which is safely extracted from session or body
      status: 'submitted',
      diagnosis: { $exists: true }
    }).exec();

    if (!submission) {
      return NextResponse.json(
        { error: 'Original submission not found or diagnosis not available' },
        { status: 404 }
      );
    }

    // Validate the answers
    const isValid = await validateFollowupAnswers(worksheetId as WorksheetType, answers);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid answers provided for worksheet' },
        { status: 400 }
      );
    }

    // Determine if this is a pillar or follow-up worksheet
    const isPillar = PILLAR_TYPES.includes(worksheetId as any);
    const isFollowup = FOLLOWUP_TYPES.includes(worksheetId as any);
    
    if (!isPillar && !isFollowup) {
      return NextResponse.json(
        { error: 'Invalid worksheet type' },
        { status: 400 }
      );
    }
    
    // Create a new FollowupAssessment record for better tracking
    const followupAssessment = new FollowupAssessment({
      userId: user._id,
      workbookSubmissionId: submission._id as unknown as mongoose.Types.ObjectId,
      followupId: worksheetId,
      status: 'completed',
      answers,
      completedAt: new Date()
    });
    
    await followupAssessment.save();
    
    if (isPillar) {
      // For pillar worksheets, store in the pillars array
      if (!submission.pillars) {
        submission.pillars = [];
      }
      
      // Check if this pillar has already been submitted
      const existingPillarIndex = submission.pillars.findIndex(
        (p: IWorksheetSubmission) => p.worksheetId === worksheetId
      );
      
      if (existingPillarIndex >= 0) {
        // Update existing pillar submission
        submission.pillars[existingPillarIndex] = {
          worksheetId,
          answers,
          submittedAt: new Date()
        };
      } else {
        // Add new pillar submission
        submission.pillars.push({
          worksheetId,
          answers,
          submittedAt: new Date()
        });
      }
    } else {
      // For follow-up worksheets, use the followup field
      // Create a new worksheet submission object
      const followupSubmission: IWorksheetSubmission = {
        worksheetId,
        answers,
        submittedAt: new Date()
      };
      
      // Set it on the submission
      submission.followup = followupSubmission;
    }
    
    // Send email notification to coaching team
    try {
      // Cast to Document type to satisfy TypeScript
      const userDoc = user as IUser & Document;
      const followupDoc = followupAssessment as IFollowupAssessment & Document;
      const submissionDoc = submission as IWorkbookSubmission & Document;
      
      await emailService.sendFollowupSubmissionNotification(userDoc, submissionDoc, followupDoc);
    } catch (emailError) {
      console.error('Error sending follow-up notification email:', emailError);
      // Continue processing even if email fails
    }
    
    // Check if we should prompt for coaching
    // We'll prompt if this is the user's first follow-up submission
    // or if they've completed multiple follow-ups
    const followupCount = await FollowupAssessment.countDocuments({
      userId: user._id,
      status: 'completed'
    });
    
    if (followupCount === 1 || followupCount % 3 === 0) {
      // Update the submission to track that we've prompted for scheduling
      submission.schedulingPrompted = true;
      
      // Send coaching prompt email
      try {
        // Cast to Document type to satisfy TypeScript
        const userDoc = user as IUser & Document;
        const submissionId = (submission._id as unknown as mongoose.Types.ObjectId).toString();
        
        await emailService.sendCoachingPrompt(userDoc, submissionId);
      } catch (promptError) {
        console.error('Error sending coaching prompt email:', promptError);
        // Continue processing even if email fails
      }
    }
    
    await submission.save();

    // Return success response with coaching prompt information
    return NextResponse.json({
      success: true,
      message: 'Follow-up worksheet submitted successfully',
      id: followupAssessment._id,
      shouldPromptCoaching: submission.schedulingPrompted || false,
      worksheetTitle: worksheetId?.title || 'Follow-up'
    });
  } catch (error) {
    console.error('Error submitting follow-up worksheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
