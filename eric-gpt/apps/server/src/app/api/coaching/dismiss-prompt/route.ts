import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/models/User';
import { emailService } from '@/services/emailService';

/**
 * @swagger
 * /api/coaching/dismiss-prompt:
 *   post:
 *     summary: Dismiss a coaching prompt
 *     description: Records when a user dismisses a coaching prompt to avoid showing it again
 *     tags:
 *       - Coaching
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - submissionId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user dismissing the prompt
 *               submissionId:
 *                 type: string
 *                 description: ID of the worksheet submission associated with the prompt
 *     responses:
 *       200:
 *         description: Coaching prompt dismissal recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Coaching prompt dismissal recorded
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized - user not authenticated
 *       500:
 *         description: Server error
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, submissionId, userEmail } = body;

    if (!userId || !submissionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get the user from the database if userEmail is provided
    let user = null;
    if (userEmail) {
      user = await getUserByEmail(userEmail);
      if (!user) {
        console.warn('User not found for email:', userEmail);
        // Continue processing even if user is not found
      }
    }

    // In a real implementation, we would update the database to track that the user
    // has dismissed the coaching prompt for this submission
    
    // Example of what the database update might look like:
    // await db.collection('coaching_prompts').updateOne(
    //   { submissionId, userId },
    //   { $set: { dismissed: true, dismissedAt: new Date() } },
    //   { upsert: true }
    // );
    
    // Send an email notification about the dismissal if we have the user object
    // This can help track user engagement and potentially trigger follow-up actions
    let emailSent = false;
    if (user) {
      try {
        emailSent = await emailService.sendCoachingPrompt(user, submissionId);
        console.log('Coaching dismissal email notification sent successfully:', emailSent);
      } catch (emailError) {
        console.error('Failed to send coaching dismissal notification:', emailError);
        // Continue with the dismissal process even if email fails
      }
    } else {
      console.log('Skipping email notification - user not available');
    }

    return NextResponse.json({
      success: true,
      message: 'Coaching prompt dismissal recorded',
      emailSent // Include email status in the response
    });
  } catch (error) {
    console.error('Error tracking coaching prompt dismissal:', error);
    return NextResponse.json(
      { error: 'Failed to record coaching prompt dismissal' },
      { status: 500 }
    );
  }
}
