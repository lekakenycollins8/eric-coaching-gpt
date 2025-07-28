import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { hasActiveSubscription } from '@/services/quotaManager';
import { loadFollowupById } from '@/utils/followupUtils';
import UserModel from '@/models/User';

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
    
    return NextResponse.json({
      success: true,
      worksheet
    }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving follow-up worksheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
