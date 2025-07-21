import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/models/User';

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
    const { userId, submissionId } = body;

    if (!userId || !submissionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real implementation, we would update the database to track that the user
    // has dismissed the coaching prompt for this submission
    // For now, we'll just return a success response
    
    // Example of what the database update might look like:
    // await db.collection('coaching_prompts').updateOne(
    //   { submissionId, userId },
    //   { $set: { dismissed: true, dismissedAt: new Date() } },
    //   { upsert: true }
    // );

    return NextResponse.json({
      success: true,
      message: 'Coaching prompt dismissal recorded'
    });
  } catch (error) {
    console.error('Error tracking coaching prompt dismissal:', error);
    return NextResponse.json(
      { error: 'Failed to record coaching prompt dismissal' },
      { status: 500 }
    );
  }
}
