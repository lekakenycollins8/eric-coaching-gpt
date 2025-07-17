import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/models';

export const dynamic = 'force-dynamic';
import WorkbookSubmission from '@/models/WorkbookSubmission';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/workbook/status:
 *   get:
 *     summary: Get user's workbook completion status
 *     description: Checks if the user has started or completed the Jackier Method Workbook
 *     tags:
 *       - Workbook
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workbook status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [not_started, draft, submitted]
 *                   description: Current status of the workbook
 *                 progress:
 *                   type: number
 *                   description: Percentage of completion (0-100)
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   description: When the workbook was last updated
 *                 submissionId:
 *                   type: string
 *                   description: ID of the workbook submission (if exists)
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       500:
 *         description: Server error
 */

/**
 * GET handler for the workbook status API endpoint
 * Returns the user's workbook completion status
 */
export async function GET() {
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

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    // Find the user's workbook submission
    const userId = session.user.id;
    const workbookId = 'jackier-method-workbook';
    
    const submission = await WorkbookSubmission.findOne({
      userId,
      workbookId
    }).sort({ updatedAt: -1 }).exec();

    if (!submission) {
      return NextResponse.json({
        status: 'not_started',
        progress: 0,
        lastUpdated: null,
        submissionId: null
      }, { status: 200 });
    }

    // Calculate progress based on answers
    const totalQuestions = Object.keys(submission.answers || {}).length;
    const answeredQuestions = Object.values(submission.answers || {})
      .filter(answer => answer !== null && answer !== undefined && answer !== '')
      .length;
    
    const progress = totalQuestions > 0 
      ? Math.round((answeredQuestions / totalQuestions) * 100) 
      : 0;

    return NextResponse.json({
      status: submission.status,
      progress: progress,
      lastUpdated: submission.updatedAt,
      submissionId: submission._id
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching workbook status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
