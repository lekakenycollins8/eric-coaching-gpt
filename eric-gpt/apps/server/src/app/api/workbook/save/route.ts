import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/models';
import WorkbookSubmission from '@/models/WorkbookSubmission';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/workbook/save:
 *   post:
 *     summary: Save partial progress on the Jackier Method Workbook
 *     description: Saves the user's current answers to the workbook as a draft
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
 *               answers:
 *                 type: object
 *                 description: User's answers to the workbook questions
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Progress saved successfully
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
 *                   description: ID of the saved submission
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       500:
 *         description: Server error
 */

/**
 * POST handler for saving workbook progress
 * Saves the user's current answers as a draft
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
    const { workbookId, answers } = body;

    // Validate required fields
    if (!workbookId || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: workbookId and answers' },
        { status: 400 }
      );
    }

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    // Find existing draft or create new one
    const userId = session.user.id;
    
    let submission = await WorkbookSubmission.findOne({
      userId,
      workbookId,
      status: 'draft'
    }).exec();

    if (!submission) {
      // Create new draft submission
      submission = new WorkbookSubmission({
        userId,
        workbookId,
        status: 'draft',
        answers: {},
        emailSent: false,
        schedulingPrompted: false
      });
    }

    // Update answers with new values
    submission.answers = {
      ...submission.answers,
      ...answers
    };
    
    await submission.save();

    return NextResponse.json({
      success: true,
      submissionId: submission._id
    }, { status: 200 });
  } catch (error) {
    console.error('Error saving workbook progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
