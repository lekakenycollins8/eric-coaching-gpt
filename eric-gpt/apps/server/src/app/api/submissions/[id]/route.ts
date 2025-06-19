import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import Submission, { ISubmission } from '@/models/Submission';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     summary: Get a specific submission by ID
 *     description: Retrieves a single worksheet submission with its feedback
 *     tags:
 *       - Submissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The submission ID
 *     responses:
 *       200:
 *         description: Submission details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submission:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     worksheetId:
 *                       type: string
 *                     worksheetTitle:
 *                       type: string
 *                     answers:
 *                       type: object
 *                     aiFeedback:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user doesn't have access to this submission
 *       404:
 *         description: Submission not found
 *       500:
 *         description: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    // Access params using proper pattern for Next.js 14+
    const { id } = await Promise.resolve(params);
    
    // Validate submission ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid submission ID format' },
        { status: 400 }
      );
    }
    
    // Get the user ID - either from session or from query parameters
    let userId: string;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get('userId');
    
    // Try to get from session first (direct API calls)
    const session = await getServerSession(authOptions);
    if (session && session.user && session.user.id) {
      userId = session.user.id;
    }
    // Otherwise use the userId from query parameters (web app proxy)
    else if (userIdParam) {
      userId = userIdParam;
    }
    // No authentication found
    else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the submission by ID
    const submission: ISubmission | null = await Submission.findById(id);
    
    // Check if the submission exists
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has access to this submission
    // Only allow access if the submission belongs to the user
    // or if the user is an admin (can be expanded later)
    if (submission.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this submission' },
        { status: 403 }
      );
    }
    
    // Return the submission
    return NextResponse.json({
      submission: {
        _id: submission._id.toString(),
        worksheetId: submission.worksheetId,
        worksheetTitle: submission.worksheetTitle,
        answers: submission.answers,
        aiFeedback: submission.aiFeedback,
        createdAt: submission.createdAt,
      }
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to fetch submission', message: errorMessage },
      { status: 500 }
    );
  }
}
