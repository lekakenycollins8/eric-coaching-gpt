import { IUser } from '../models/User';
import mongoose from 'mongoose';
import { getUserSubscriptionTier, hasActiveSubscription } from '../services/quotaManager';

/**
 * Checks if a user has access to a specific feature based on their subscription
 * @param user - The user object
 * @param feature - The feature to check access for
 * @returns Whether the user has access to the feature
 */
export async function hasFeatureAccess(user: IUser, feature: string): Promise<boolean> {
  try {
    // Get the user ID as string
    const userId = user._id instanceof mongoose.Types.ObjectId 
      ? user._id.toString() 
      : String(user._id);
      
    // First check if the user has an active subscription
    const isActive = await hasActiveSubscription(userId);
    if (!isActive) {
      return false;
    }

    // Get the user's subscription tier
    const tier = await getUserSubscriptionTier(userId);
    
    // Define feature access by tier
    const featureAccess: Record<string, string[]> = {
      'FOUNDATION': ['worksheets', 'basic_diagnosis', 'coaching'], // Added coaching to FOUNDATION tier
      'PROFESSIONAL': ['worksheets', 'basic_diagnosis', 'advanced_diagnosis', 'follow_up', 'coaching'], // Added coaching to PROFESSIONAL tier
      'EXECUTIVE': ['worksheets', 'basic_diagnosis', 'advanced_diagnosis', 'follow_up', 'coaching'],
      'LEGACY': ['worksheets', 'basic_diagnosis', 'advanced_diagnosis', 'follow_up', 'coaching'],
    };
    
    // Check if the user's tier has access to the requested feature
    if (tier && featureAccess[tier]) {
      return featureAccess[tier].includes(feature);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking feature access:', error);
    // Default to no access on error
    return false;
  }
}
