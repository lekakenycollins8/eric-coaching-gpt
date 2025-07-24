import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { hasActiveSubscription } from '@/services/quotaManager';
import fs from 'fs';
import path from 'path';
import UserModel from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/followup/worksheets:
 *   get:
 *     summary: Get all follow-up worksheets
 *     description: Returns all available follow-up worksheets for the authenticated user
 *     tags:
 *       - Followup
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [pillar, implementation, all]
 *         description: Type of follow-up worksheets to retrieve
 *         default: all
 *     responses:
 *       200:
 *         description: List of follow-up worksheets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 worksheets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [pillar, implementation]
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       500:
 *         description: Server error
 */

/**
 * GET handler for retrieving follow-up worksheets
 * Returns all available follow-up worksheets for the authenticated user
 */
export async function GET(request: Request) {
  try {
    // Get the worksheet type from query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all';
    
    // Try to authenticate via session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
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
    
    // Load follow-up worksheets based on type
    let worksheets: any[] = [];
    
    if (type === 'all' || type === 'pillar') {
      try {
        const pillarFollowupsPath = path.join(process.cwd(), 'src/data/crystal-clear-leadership-followup.json');
        const pillarFollowups = JSON.parse(fs.readFileSync(pillarFollowupsPath, 'utf8'));
        
        // Add type field to each worksheet
        const pillarWorksheets = pillarFollowups.map((worksheet: any) => ({
          ...worksheet,
          type: 'pillar'
        }));
        
        worksheets = [...worksheets, ...pillarWorksheets];
      } catch (error) {
        console.error('Error loading pillar follow-up worksheets:', error);
      }
    }
    
    if (type === 'all' || type === 'implementation') {
      try {
        const implementationFollowupsPath = path.join(process.cwd(), 'src/data/implementation-support-followup.json');
        const implementationFollowups = JSON.parse(fs.readFileSync(implementationFollowupsPath, 'utf8'));
        
        // Add type field to each worksheet
        const implementationWorksheets = implementationFollowups.map((worksheet: any) => ({
          ...worksheet,
          type: 'implementation'
        }));
        
        worksheets = [...worksheets, ...implementationWorksheets];
      } catch (error) {
        console.error('Error loading implementation follow-up worksheets:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      worksheets
    }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving follow-up worksheets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
