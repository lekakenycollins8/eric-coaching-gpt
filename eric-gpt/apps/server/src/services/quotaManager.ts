import { QUOTA_LIMITS, SubscriptionTier } from '../config/openai';
import User from '../models/User';
import Submission from '../models/Submission';
import { connectToDatabase } from '../db/connection';
import 'server-only'; // Ensure this module is never bundled for the client
import mongoose from 'mongoose';

/**
 * Quota Manager Service
 * Handles tracking and enforcing usage quotas based on subscription tiers
 */

/**
 * Gets the user's subscription tier
 * @param userId - The ID of the user
 * @returns The user's subscription tier or null if not found
 */
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier | null> {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    
    // Check if subscription status is active or past_due
    // This matches the client-side validation in hasFeatureAccess
    const validStatuses = ['active', 'past_due'];
    if (!user || !user.subscription || !validStatuses.includes(user.subscription.status)) {
      return null;
    }
    
    // Map the subscription plan to a tier based on the plan ID from Stripe
    // This mapping should match the tiers defined in QUOTA_LIMITS and STRIPE_PLANS
    const planId = user.subscription.planId || '';
    
    if (planId.startsWith('foundation_')) {
      return 'FOUNDATION';
    } else if (planId.startsWith('momentum_')) {
      return 'MOMENTUM';
    } else if (planId.startsWith('legacy_')) {
      return 'LEGACY';
    } else if (planId.startsWith('executive_')) {
      return 'EXECUTIVE';
    }
    
    // If we can't determine from planId, try to use the price ID
    const priceId = user.subscription.priceId || '';
    if (priceId.includes('price_')) {
      // Get price IDs from environment variables
      const foundationMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDATION_MONTHLY || '';
      const momentumMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_MOMENTUM_MONTHLY || '';
      const legacyMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_LEGACY_MONTHLY || '';
      const executiveMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_EXECUTIVE_MONTHLY || '';
      
      if (priceId === foundationMonthlyPriceId) {
        return 'FOUNDATION';
      } else if (priceId === momentumMonthlyPriceId) {
        return 'MOMENTUM';
      } else if (priceId === legacyMonthlyPriceId) {
        return 'LEGACY';
      } else if (priceId === executiveMonthlyPriceId) {
        return 'EXECUTIVE';
      }
    }
    
    // Default to the lowest tier if no match is found
    console.warn(`Could not determine subscription tier for plan: ${planId}, price: ${priceId}. Defaulting to FOUNDATION tier.`);
    return 'FOUNDATION';
  } catch (error) {
    console.error('Error getting user subscription tier:', error);
    throw new Error('Failed to determine user subscription tier');
  }
}

/**
 * Gets the user's quota limits based on their subscription tier
 * @param userId - The ID of the user
 * @returns The quota limits for the user's subscription tier
 */
export async function getUserQuotaLimits(userId: string) {
  const tier = await getUserSubscriptionTier(userId);
  
  if (!tier) {
    throw new Error('User does not have an active subscription');
  }
  
  return QUOTA_LIMITS[tier];
}

/**
 * Counts the number of submissions made by the user in the current billing period
 * @param userId - The ID of the user
 * @returns The number of submissions made in the current period
 */
export async function countUserSubmissionsInCurrentPeriod(userId: string): Promise<number> {
  try {
    await connectToDatabase();
    
    // Get the user to determine their billing cycle
    const user = await User.findById(userId);
    
    if (!user || !user.subscription) {
      throw new Error('User does not have an active subscription');
    }
    
    // Calculate the start of the current billing period
    // Handle both Date objects and timestamps for backward compatibility
    const currentPeriodStart = user.subscription.currentPeriodStart 
      ? (user.subscription.currentPeriodStart instanceof Date 
          ? user.subscription.currentPeriodStart 
          : new Date(typeof user.subscription.currentPeriodStart === 'number' 
              ? user.subscription.currentPeriodStart * 1000 
              : user.subscription.currentPeriodStart)) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    
    // Count submissions since the start of the current period
    const submissionCount = await Submission.countDocuments({
      userId: userId,
      createdAt: { $gte: currentPeriodStart }
    });
    
    return submissionCount;
  } catch (error) {
    console.error('Error counting user submissions:', error);
    throw new Error('Failed to count user submissions');
  }
}

/**
 * Checks if the user has exceeded their quota
 * @param userId - The ID of the user
 * @returns Whether the user has exceeded their quota
 */
export async function hasUserExceededQuota(userId: string): Promise<boolean> {
  try {
    const quotaLimits = await getUserQuotaLimits(userId);
    const submissionCount = await countUserSubmissionsInCurrentPeriod(userId);
    
    return submissionCount >= quotaLimits.monthlySubmissions;
  } catch (error) {
    console.error('Error checking user quota:', error);
    throw new Error('Failed to check user quota');
  }
}

/**
 * Gets the user's remaining quota
 * @param userId - The ID of the user
 * @returns The number of submissions remaining in the current period, or 0 if no active subscription
 */
export async function getUserRemainingQuota(userId: string): Promise<number> {
  try {
    // First check if user has an active subscription
    const hasSubscription = await hasActiveSubscription(userId);
    if (!hasSubscription) {
      return 0; // Return 0 quota for users without an active subscription
    }
    
    const quotaLimits = await getUserQuotaLimits(userId);
    const submissionCount = await countUserSubmissionsInCurrentPeriod(userId);
    
    return Math.max(0, quotaLimits.monthlySubmissions - submissionCount);
  } catch (error) {
    console.error('Error getting user remaining quota:', error);
    // Return 0 instead of throwing an error to prevent client-side issues
    return 0;
  }
}

/**
 * Checks if a user has an active subscription
 * @param userId - The ID of the user
 * @returns Whether the user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    console.log(`[DEBUG] hasActiveSubscription - Checking subscription for userId: ${userId}`);
    await connectToDatabase();
    
    // Validate userId format to avoid MongoDB errors
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`[DEBUG] hasActiveSubscription - Invalid userId format: ${userId}`);
      return false;
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`[DEBUG] hasActiveSubscription - User not found for userId: ${userId}`);
      return false;
    }
    
    if (!user.subscription) {
      console.error(`[DEBUG] hasActiveSubscription - No subscription found for userId: ${userId}`);
      return false;
    }
    
    // Check if subscription status is active or past_due
    // This matches the client-side validation in hasFeatureAccess
    const validStatuses = ['active', 'past_due'];
    const isValid = validStatuses.includes(user.subscription.status);
    
    console.log(`[DEBUG] hasActiveSubscription - User: ${userId}, Status: ${user.subscription.status}, Valid: ${isValid}`);
    console.log(`[DEBUG] hasActiveSubscription - Plan ID: ${user.subscription.planId}, Price ID: ${user.subscription.priceId || 'N/A'}`);
    
    return isValid;
  } catch (error) {
    console.error('[DEBUG] hasActiveSubscription - Error checking user subscription status:', error);
    return false;
  }
}

/**
 * Records a submission and updates the user's quota usage
 * @param userId - The ID of the user
 * @param tokensUsed - The number of tokens used in the submission
 */
export async function recordSubmissionUsage(userId: string, tokensUsed: number): Promise<void> {
  try {
    await connectToDatabase();
    
    // Get the user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Ensure user has required fields
    if (!user.name) {
      console.warn(`User ${userId} is missing required field 'name'. Adding default value.`);
      user.name = 'User';
    }
    
    // Update the user's usage statistics
    // This could be expanded to track more detailed usage metrics
    if (!user.usage) {
      user.usage = {
        totalSubmissions: 1,
        totalTokensUsed: tokensUsed
      };
    } else {
      user.usage.totalSubmissions = (user.usage.totalSubmissions || 0) + 1;
      user.usage.totalTokensUsed = (user.usage.totalTokensUsed || 0) + tokensUsed;
    }
    
    // Also update the submissionsThisPeriod counter in the subscription object
    // This ensures the counter is in sync with the actual submissions count
    if (user.subscription) {
      user.subscription.submissionsThisPeriod = (user.subscription.submissionsThisPeriod || 0) + 1;
    }
    
    await user.save();
  } catch (error) {
    console.error('Error recording submission usage:', error);
    throw new Error('Failed to record submission usage');
  }
}
