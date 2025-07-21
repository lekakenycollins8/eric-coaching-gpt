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
 * /api/workbook/submission:
 *   get:
 *     summary: Get user's workbook submission
 *     description: Retrieves the user's workbook submission data
 *     tags:
 *       - Workbook
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workbook submission retrieved successfully
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       404:
 *         description: Not found - No submission found for this user
 *       500:
 *         description: Server error
 */

/**
 * GET handler for the workbook submission API endpoint
 * Returns the user's workbook submission data
 */
export async function GET(request: Request) {
  try {
    // Parse URL to get query parameters
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');
    
    // Try to authenticate via session first
    const session = await getServerSession(authOptions);
    let userId;
    
    // If session exists, use the user ID from the session
    if (session && session.user) {
      userId = session.user.id;
    } 
    // Otherwise, check if userId was provided in query parameters
    else if (queryUserId) {
      userId = queryUserId;
      console.log(`Using userId parameter for authentication: ${queryUserId}`);
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

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    // Find the user's workbook submission
    const workbookId = 'jackier-method-workbook';
    
    const submission = await WorkbookSubmission.findOne({
      userId,
      workbookId
    }).sort({ updatedAt: -1 }).exec();

    // If no submission is found, return an empty response with status 200
    // This allows the frontend to handle the case where the user hasn't started the workbook yet
    if (!submission) {
      return NextResponse.json({
        exists: false,
        message: 'User has not started the workbook yet',
        data: null
      }, { status: 200 });
    }

    // Return the submission with a consistent response format
    return NextResponse.json({
      exists: true,
      message: 'Workbook submission found',
      data: submission
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching workbook submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
