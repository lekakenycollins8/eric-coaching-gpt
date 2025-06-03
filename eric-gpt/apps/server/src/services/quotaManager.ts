import { QUOTA_LIMITS, SubscriptionTier } from '../config/openai';
import User from '../models/User';
import Submission from '../models/Submission';
import { connectToDatabase } from '../db/connection';
import 'server-only'; // Ensure this module is never bundled for the client

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
    
    if (!user || !user.subscription) {
      return null;
    }
    
    // Map the subscription plan to a tier based on the plan ID from Stripe
    // This mapping should match the tiers defined in QUOTA_LIMITS and STRIPE_PLANS
    const planId = user.subscription.planId || '';
    
    if (planId.startsWith('solo_')) {
      return 'SOLO';
    } else if (planId.startsWith('pro_')) {
      return 'PRO';
    } else if (planId.startsWith('vip_')) {
      return 'VIP';
    }
    
    // If we can't determine from planId, try to use the price ID
    const priceId = user.subscription.priceId || '';
    if (priceId.includes('price_')) {
      // These should match the price IDs in the Stripe config
      if (priceId === 'price_1RMCyVP1DJ8H8ccarTX30pgj' || priceId === 'price_1RMCyVP1DJ8H8ccaFG3rYjz9') {
        return 'SOLO';
      } else if (priceId === 'price_1RMD3MP1DJ8H8ccaRa5Mc4TR' || priceId === 'price_1RMD4AP1DJ8H8ccaKSuVZrNR') {
        return 'PRO';
      } else if (priceId === 'price_1RMD4jP1DJ8H8ccaYCqHj8t4' || priceId === 'price_1RMD5AP1DJ8H8ccaJ5QrFOzq') {
        return 'VIP';
      }
    }
    
    // Default to the lowest tier if no match is found
    console.warn(`Could not determine subscription tier for plan: ${planId}, price: ${priceId}. Defaulting to SOLO tier.`);
    return 'SOLO';
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
 * @returns The number of submissions remaining in the current period
 */
export async function getUserRemainingQuota(userId: string): Promise<number> {
  try {
    const quotaLimits = await getUserQuotaLimits(userId);
    const submissionCount = await countUserSubmissionsInCurrentPeriod(userId);
    
    return Math.max(0, quotaLimits.monthlySubmissions - submissionCount);
  } catch (error) {
    console.error('Error getting user remaining quota:', error);
    throw new Error('Failed to get user remaining quota');
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
