import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { hasActiveSubscription } from '@/services/quotaManager';
import WorkbookSubmissionModel from '@/models/WorkbookSubmission';
import { IWorkbookSubmission } from '@/models/WorkbookSubmission';
import UserModel from '@/models/User';
import { determineFollowupTrigger, getTriggeredFollowups } from '@/utils/followupTriggerUtils';
import { loadFollowupById } from '@/utils/followupUtils';

// Define a type for WorkbookSubmission document that includes both model instance and interface properties
type WorkbookSubmission = InstanceType<typeof WorkbookSubmissionModel> & IWorkbookSubmission & {
  submittedAt?: Date;
  createdAt: Date;
  _id: any;
};

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/followup/recommendations:
 *   get:
 *     summary: Get follow-up worksheet recommendations
 *     description: Returns recommended follow-up worksheets based on user's previous submissions
 *     tags:
 *       - Followup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Follow-up recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       worksheetId:
 *                         type: string
 *                       worksheetTitle:
 *                         type: string
 *                       originalSubmissionId:
 *                         type: string
 *                       reason:
 *                         type: string
 *                       priority:
 *                         type: string
 *                         enum: [high, medium, low]
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       500:
 *         description: Server error
 */

/**
 * GET handler for retrieving follow-up worksheet recommendations
 * Returns recommended follow-up worksheets based on user's previous submissions
 */
export async function GET(request: Request) {
  try {
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
    const hasQuota = await hasActiveSubscription(userId);
    if (!hasQuota) {
      return NextResponse.json(
        { error: 'Subscription quota exceeded' },
        { status: 403 }
      );
    }
    
    // Get user's workbook submissions
    const submissions = await WorkbookSubmissionModel.find({ userId })
      .sort({ submittedAt: -1, createdAt: -1 }) // Most recent first, fallback to createdAt
      .limit(10) as unknown as WorkbookSubmission[]; // Cast to our defined type
    
    if (!submissions || submissions.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: []
      }, { status: 200 });
    }
    
    // Process submissions to determine follow-up recommendations
    // Use the getTriggeredFollowups utility to get prioritized recommendations
    const triggerResults = getTriggeredFollowups(submissions);
    
    // Map trigger results to detailed recommendations with worksheet info
    const recommendations = [];
    const processedSubmissionIds = new Set(); // Track processed submissions to avoid duplicates
    
    for (const triggerResult of triggerResults) {
      // Skip if we've already processed this submission
      if (triggerResult.originalSubmissionId && 
          processedSubmissionIds.has(triggerResult.originalSubmissionId)) {
        continue;
      }
      
      if (triggerResult.worksheetId) {
        try {
          // Load the worksheet details
          const { worksheet, type } = await loadFollowupById(triggerResult.worksheetId);
          
          if (worksheet) {
            // Determine priority based on reason
            let priority = 'medium';
            if (triggerResult.reason.includes('explicitly requested')) {
              priority = 'high';
            } else if (triggerResult.reason.includes('Low ratings')) {
              priority = 'high';
            } else if (triggerResult.reason.includes('time')) {
              priority = 'low';
            }
            
            // Find the original submission for additional context
            const originalSubmission = submissions.find(s => 
              s._id && s._id.toString() === triggerResult.originalSubmissionId
            );
            
            // Get submission date (with fallback)
            const submissionDate = originalSubmission ? 
              (originalSubmission.submittedAt || originalSubmission.createdAt) : 
              null;
            
            // Add to recommendations
            recommendations.push({
              worksheetId: triggerResult.worksheetId,
              worksheetTitle: worksheet.title,
              worksheetType: type,
              worksheetDescription: worksheet.description || '',
              originalSubmissionId: triggerResult.originalSubmissionId,
              submittedAt: submissionDate,
              reason: triggerResult.reason,
              priority,
              pillars: triggerResult.pillars || []
            });
            
            // Mark this submission as processed
            if (triggerResult.originalSubmissionId) {
              processedSubmissionIds.add(triggerResult.originalSubmissionId);
            }
          }
        } catch (error) {
          console.error(`Error loading worksheet ${triggerResult.worksheetId}:`, error);
          // Continue with other recommendations
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      recommendations
    }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving follow-up recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
