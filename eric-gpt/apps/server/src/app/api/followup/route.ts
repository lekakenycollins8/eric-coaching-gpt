import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/models';
import WorkbookSubmission from '@/models/WorkbookSubmission';
import mongoose from 'mongoose';
import { loadWorksheet, validateFollowupAnswers, WorksheetType, PillarType, FollowupType } from '@/utils/followupUtils';

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
    // Get the submission ID from the URL query parameters
    const url = new URL(request.url);
    const submissionId = url.searchParams.get('submissionId');

    // Check if submissionId is provided
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: submissionId' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has an active subscription
    await connectToDatabase();
    const user = await User.findById(session.user.id);
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

    // Find the submission with diagnosis
    const submission = await WorkbookSubmission.findOne({
      _id: submissionId,
      userId: session.user.id,
      status: 'submitted',
      diagnosis: { $exists: true }
    }).exec();

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found or diagnosis not available' },
        { status: 404 }
      );
    }

    // Get the follow-up worksheet IDs from the diagnosis
    const followupWorksheets = submission.diagnosis?.followupWorksheets;
    if (!followupWorksheets) {
      return NextResponse.json(
        { error: 'No follow-up worksheets recommended in diagnosis' },
        { status: 404 }
      );
    }
    
    // Get the worksheet type from query parameters or use the first recommended pillar
    const worksheetType = url.searchParams.get('worksheetType') as WorksheetType || 
                         followupWorksheets.pillars[0] || 
                         followupWorksheets.followup;
    
    if (!worksheetType) {
      return NextResponse.json(
        { error: 'No worksheet type specified or recommended' },
        { status: 400 }
      );
    }

    // Load the worksheet
    const worksheet = await loadWorksheet(worksheetType);
    if (!worksheet) {
      return NextResponse.json(
        { error: 'Worksheet not found' },
        { status: 404 }
      );
    }

    // Return the worksheet
    return NextResponse.json({
      success: true,
      worksheet
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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has an active subscription
    await connectToDatabase();
    const user = await User.findById(session.user.id);
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

    // Parse request body
    const body = await request.json();
    const { submissionId, worksheetId, answers } = body;

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
      userId: session.user.id,
      status: 'submitted',
      diagnosis: { $exists: true }
    }).exec();

    if (!submission) {
      return NextResponse.json(
        { error: 'Original submission not found or diagnosis not available' },
        { status: 404 }
      );
    }

    // Validate the answers against the worksheet
    const isValid = await validateFollowupAnswers(worksheetId as WorksheetType, answers);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid answers for the specified worksheet' },
        { status: 400 }
      );
    }

    // Save the follow-up answers to the submission
    submission.followup = {
      worksheetId,
      answers,
      submittedAt: new Date()
    };
    await submission.save();

    return NextResponse.json({
      success: true,
      followupId: worksheetId
    });
  } catch (error) {
    console.error('Error submitting follow-up worksheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
