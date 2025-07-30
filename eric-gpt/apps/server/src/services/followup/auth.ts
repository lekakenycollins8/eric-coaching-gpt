import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasActiveSubscription } from '@/services/quotaManager';
import UserModel from '@/models/User';
import mongoose from 'mongoose';

/**
 * Authenticates and validates the user from the request
 * Checks for session, user existence, and active subscription
 */
interface User {
  _id: mongoose.Types.ObjectId;
  [key: string]: any;
}

export async function authenticateAndValidateUser(request: Request, bodyUserId?: string) {
  // First try to authenticate via session
  const session = await getServerSession(authOptions);
  
  // If session exists, use it
  if (session?.user?.id) {
    const user = await UserModel.findOne({ email: session.user.email }) as User | null;
    
    if (!user) {
      return {
        error: NextResponse.json({ error: 'User not found' }, { status: 404 }),
        user: null
      };
    }
    
    const hasSubscription = await hasActiveSubscription(user._id.toString());
    
    if (!hasSubscription) {
      return {
        error: NextResponse.json({ error: 'Active subscription required' }, { status: 403 }),
        user: null
      };
    }
    
    return { error: null, user };
  }
  
  // If no session but bodyUserId is provided, try to authenticate with that
  if (bodyUserId) {
    console.log(`Using userId parameter for authentication: ${bodyUserId}`);
    const user = await UserModel.findById(bodyUserId) as User | null;
    
    if (!user) {
      return {
        error: NextResponse.json({ error: 'User not found with provided userId' }, { status: 404 }),
        user: null
      };
    }
    
    const hasSubscription = await hasActiveSubscription(user._id.toString());
    
    if (!hasSubscription) {
      return {
        error: NextResponse.json({ error: 'Active subscription required' }, { status: 403 }),
        user: null
      };
    }
    
    return { error: null, user };
  }
  
  // If neither session nor bodyUserId exists, return authentication error
  return { 
    error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    user: null
  };
  
  // This code is unreachable due to the refactoring above
  // Keeping this comment as a reminder that the logic has been moved to the if blocks above
}
