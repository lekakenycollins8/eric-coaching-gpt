import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../db/connection';
import User from '../../../../models/User';

export const dynamic = 'force-dynamic';

/**
 * API route for fetching a user's subscription data
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
