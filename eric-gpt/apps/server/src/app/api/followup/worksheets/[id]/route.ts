import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { hasActiveSubscription } from '@/services/quotaManager';
import { loadFollowupById, getFollowupType } from '@/utils/followupUtils';
import UserModel from '@/models/User';
import WorkbookSubmissionModel, { IWorkbookSubmission } from '@/models/WorkbookSubmission';

// Define a type for WorkbookSubmission document that includes both model instance and interface properties
type WorkbookSubmission = InstanceType<typeof WorkbookSubmissionModel> & IWorkbookSubmission & {
  submittedAt?: Date;
  createdAt: Date;
  _id: any;
  worksheetId?: string;
};

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/followup/worksheets/{id}:
 *   get:
 *     summary: Get a specific follow-up worksheet by ID
 *     description: Returns a specific follow-up worksheet by its ID
 *     tags:
 *       - Followup
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the follow-up worksheet to retrieve
 *     responses:
 *       200:
 *         description: Follow-up worksheet details
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
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: object
 *                     type:
 *                       type: string
 *                       enum: [pillar, implementation]
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       404:
 *         description: Not found - Worksheet not found
 *       500:
 *         description: Server error
 */

/**
 * GET handler for retrieving a specific follow-up worksheet by ID
 * Returns the worksheet details if found
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Worksheet ID is required' },
        { status: 400 }
      );
    }
    
    // Get the URL to extract query parameters
    const url = new URL(request.url);
    
    // Get the authenticated user from session or query parameter
    let userId;
    
    // First try to get userId from the session
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // If no session, try to get userId from query parameters (for web app proxy requests)
      userId = url.searchParams.get('userId');
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    // Connect to database and verify user
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
    
    // Check if user has quota available
    const hasQuota = await hasActiveSubscription(userId);
    if (!hasQuota) {
      return NextResponse.json(
        { error: 'Subscription quota exceeded' },
        { status: 403 }
      );
    }
    
    // Load the worksheet using the utility function
    const { worksheet, type: worksheetType } = await loadFollowupById(id);
    
    // Check if worksheet was found
    if (!worksheet) {
      return NextResponse.json(
        { error: 'Follow-up worksheet not found' },
        { status: 404 }
      );
    }
    
    if (!worksheet) {
      return NextResponse.json(
        { error: 'Follow-up worksheet not found' },
        { status: 404 }
      );
    }
    
    // Add type field to the worksheet
    worksheet.type = worksheetType;
    
    // Get the submission ID from the query parameters (if provided)
    const submissionId = url.searchParams.get('submissionId');
    
    // Check if we need to include previous submission data for context
    let previousSubmission = null;
    if (submissionId) {
      try {
        // Find the specified submission
        previousSubmission = await WorkbookSubmissionModel.findById(submissionId) as WorkbookSubmission;
        
        // Verify that the submission belongs to the user
        if (previousSubmission && previousSubmission.userId.toString() !== userId) {
          previousSubmission = null; // Don't include if it doesn't belong to the user
        }
      } catch (error) {
        console.error('Error fetching previous submission:', error);
        // Continue without the previous submission
      }
    } else {
      // If no submission ID was provided, try to find the most recent submission
      try {
        // Determine the follow-up type to know what kind of submission to look for
        const followupType = getFollowupType(id);
        
        // Find the user's most recent workbook submission
        const recentSubmission = await WorkbookSubmissionModel.findOne({ 
          userId: userId 
        }).sort({ submittedAt: -1, createdAt: -1 }) as WorkbookSubmission;
        
        if (recentSubmission) {
          previousSubmission = recentSubmission;
        }
      } catch (error) {
        console.error('Error finding recent submission:', error);
        // Continue without the previous submission
      }
    }
    
    // Prepare the previous submission data for the response, handling optional fields safely
    let previousSubmissionData = null;
    if (previousSubmission) {
      previousSubmissionData = {
        id: previousSubmission._id,
        submittedAt: previousSubmission.submittedAt || previousSubmission.createdAt,
        // Use worksheetId as title if title is not available
        title: previousSubmission.worksheetId ? `Workbook: ${previousSubmission.worksheetId}` : 'Workbook Submission',
        answers: previousSubmission.answers || {},
        pillars: previousSubmission.pillars || [],
        diagnosis: previousSubmission.diagnosis || null
      };
    }
    
    return NextResponse.json({
      success: true,
      worksheet,
      previousSubmission: previousSubmissionData
    }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving follow-up worksheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
