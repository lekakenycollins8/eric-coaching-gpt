import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../db/connection';
import User from '../../../../models/User';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/user/subscription:
 *   get:
 *     summary: Get user subscription information
 *     description: Retrieves the current user's subscription details
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User subscription data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     planId:
 *                       type: string
 *                       description: ID of the subscription plan
 *                     status:
 *                       type: string
 *                       enum: [active, past_due, canceled]
 *                       description: Current status of the subscription
 *                     currentPeriodStart:
 *                       type: string
 *                       format: date-time
 *                       description: Start date of the current billing period
 *                     currentPeriodEnd:
 *                       type: string
 *                       format: date-time
 *                       description: End date of the current billing period
 *                     submissionsThisPeriod:
 *                       type: integer
 *                       description: Number of submissions used in the current period
 *                 stripeCustomerId:
 *                   type: string
 *                   description: Stripe customer ID for the user
 *       401:
 *         description: Unauthorized - Missing or invalid authorization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function GET(request: Request) {
  try {
    // Get the user ID from the authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    
    // Extract the user ID from the Bearer token
    const userId = authHeader.replace('Bearer ', '');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing user ID' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return the user's subscription data
    return NextResponse.json({
      subscription: user.subscription || null,
      stripeCustomerId: user.stripeCustomerId || null
    });
  } catch (error: any) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
