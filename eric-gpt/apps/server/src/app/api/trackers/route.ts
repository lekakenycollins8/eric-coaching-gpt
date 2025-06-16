import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Tracker, User } from '@/models';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/trackers:
 *   get:
 *     summary: Get all trackers for the current user
 *     description: Returns all trackers for the authenticated user
 *     tags:
 *       - Trackers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, abandoned]
 *         description: Filter trackers by status
 *       - in: query
 *         name: submissionId
 *         schema:
 *           type: string
 *         description: Filter trackers by submission ID
 *     responses:
 *       200:
 *         description: List of trackers
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user doesn't have an active subscription
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from session or query parameter
    let userId;
    
    // First try to get userId from the session
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // If no session, try to get userId from query parameters (for web app proxy requests)
      const searchParams = request.nextUrl.searchParams;
      userId = searchParams.get('userId');
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const submissionId = searchParams.get('submissionId');

    // Build query
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) {
      query.status = status;
    }
    if (submissionId) {
      query.submissionId = new mongoose.Types.ObjectId(submissionId);
    }

    // Get trackers
    const trackers = await Tracker.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(trackers);
  } catch (error) {
    console.error('Error getting trackers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get trackers', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/trackers:
 *   post:
 *     summary: Create a new tracker
 *     description: Creates a new tracker for the authenticated user
 *     tags:
 *       - Trackers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               submissionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tracker created successfully
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user doesn't have an active subscription
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from session or request body
    let userId;
    let body;
    
    // First try to get userId from the session
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
      body = await request.json();
    } else {
      // If no session, try to get userId from request body (for web app proxy requests)
      body = await request.json();
      userId = body.userId;
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Remove userId from body to avoid duplicate
      delete body.userId;
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

    // Body has already been parsed earlier
    const { title, description, startDate, endDate, submissionId } = body;

    // Validate required fields
    if (!title || !description || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that endDate is 5 days after startDate
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff !== 5) {
      return NextResponse.json(
        { error: 'End date must be exactly 5 days after start date' },
        { status: 400 }
      );
    }

    // Create tracker
    const tracker = new Tracker({
      userId,
      title,
      description,
      startDate: start,
      endDate: end,
      submissionId: submissionId ? new mongoose.Types.ObjectId(submissionId) : undefined,
      status: 'active',
    });

    await tracker.save();

    return NextResponse.json(tracker, { status: 201 });
  } catch (error) {
    console.error('Error creating tracker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create tracker', message: errorMessage },
      { status: 500 }
    );
  }
}
