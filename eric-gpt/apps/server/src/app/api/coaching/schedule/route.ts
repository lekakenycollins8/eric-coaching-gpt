import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/models/User';
import { hasFeatureAccess } from '@/utils/subscription';
import { emailService } from '@/services/emailService';
import { connectToDatabase } from '@/db/connection';

/**
 * @swagger
 * /api/coaching/schedule:
 *   post:
 *     summary: Schedule a coaching session
 *     description: Handles scheduling of coaching sessions for users
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
 *               - userEmail
 *               - date
 *               - time
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user scheduling the session
 *               userName:
 *                 type: string
 *                 description: Name of the user scheduling the session
 *               userEmail:
 *                 type: string
 *                 description: Email of the user scheduling the session
 *               date:
 *                 type: string
 *                 description: Date for the coaching session (YYYY-MM-DD)
 *               time:
 *                 type: string
 *                 description: Time for the coaching session (HH:MM)
 *               notes:
 *                 type: string
 *                 description: Optional notes for the coaching session
 *               submissionId:
 *                 type: string
 *                 description: Optional ID of the worksheet submission that prompted this coaching session
 *     responses:
 *       200:
 *         description: Coaching session scheduled successfully
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
 *                   example: Coaching session scheduled successfully
 *                 schedulingId:
 *                   type: string
 *                   example: sched_1234567890
 *                 details:
 *                   type: object
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user does not have access to coaching features
 *       500:
 *         description: Server error
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, userName, userEmail, date, time, notes, submissionId } = body;

    if (!userId || !userEmail || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Connect to the database first
    try {
      await connectToDatabase();
      console.log('Connected to database before user lookup');
    } catch (dbError) {
      console.error('Failed to connect to database:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Get the user from the database
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to coaching features
    const hasAccess = await hasFeatureAccess(user, 'coaching');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Subscription required for coaching sessions' }, { status: 403 });
    }

    // 1. Save the scheduling request to the database
    // For now, we'll simulate a successful scheduling with a generated ID
    const schedulingId = `sched_${Date.now()}`;
    
    // 2. Send a confirmation email to the user
    // This uses the EmailService to send confirmation emails
    let emailSent = false;
    try {
      // Pass the scheduling details to the email service
      const schedulingDetails = {
        date,
        time,
        notes
      };
      emailSent = await emailService.sendCoachingPrompt(user, submissionId, schedulingDetails);
      console.log('Coaching confirmation email sent successfully:', emailSent);
    } catch (emailError) {
      console.error('Error sending coaching prompt:', emailError);
      // Continue with the scheduling process even if email fails
    }
    
    // 3. In a production environment, we would also:
    //    - Send an email to the coaching team
    //    - Create a calendar invitation
    
    // Return a success response with the scheduling details
    return NextResponse.json({
      success: true,
      message: 'Coaching session scheduled successfully',
      schedulingId,
      emailSent, // Include email status in the response
      details: {
        date,
        time,
        notes,
        submissionId,
        user: {
          id: userId,
          name: userName,
          email: userEmail
        }
      }
    });
  } catch (error) {
    console.error('Error scheduling coaching session:', error);
    return NextResponse.json(
      { error: 'Failed to schedule coaching session' },
      { status: 500 }
    );
  }
}
