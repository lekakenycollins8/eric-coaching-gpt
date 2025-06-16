import type { Subscription } from '@/hooks/useSubscription';
import type { PlanId } from '@/lib/stripe/plans';

/**
 * Feature access map defining which features are available for each subscription plan
 */
export const FEATURE_ACCESS_MAP = {
  // Free tier has limited access
  free: {
    worksheetView: true,
    worksheetSubmit: false,
    trackerView: true,
    trackerCreate: false,
    trackerEntryUpdate: false,
    trackerReflectionUpdate: false,
    aiCoaching: false,
  },
  // Foundation Builder Plan
  foundation_monthly: {
    worksheetView: true,
    worksheetSubmit: true,
    trackerView: true,
    trackerCreate: true,
    trackerEntryUpdate: true,
    trackerReflectionUpdate: true,
    aiCoaching: true,
  },
  // Momentum Maker Plan
  momentum_monthly: {
    worksheetView: true,
    worksheetSubmit: true,
    trackerView: true,
    trackerCreate: true,
    trackerEntryUpdate: true,
    trackerReflectionUpdate: true,
    aiCoaching: true,
  },
  // Legacy Leader Plan
  legacy_monthly: {
    worksheetView: true,
    worksheetSubmit: true,
    trackerView: true,
    trackerCreate: true,
    trackerEntryUpdate: true,
    trackerReflectionUpdate: true,
    aiCoaching: true,
  },
  // Executive Accelerator Plan
  executive_monthly: {
    worksheetView: true,
    worksheetSubmit: true,
    trackerView: true,
    trackerCreate: true,
    trackerEntryUpdate: true,
    trackerReflectionUpdate: true,
    aiCoaching: true,
  },
};

// Map any variant plan IDs from Stripe to our internal plan IDs
const PLAN_ID_MAPPING: Record<string, SubscriptionPlanId> = {
  'foundation_monthly': 'foundation_monthly',
  'momentum_monthly': 'momentum_monthly',
  'legacy_monthly': 'legacy_monthly',
  'executive_monthly': 'executive_monthly',
  // Add any other variations here if needed
};

export type FeatureKey = keyof typeof FEATURE_ACCESS_MAP.free;

type SubscriptionPlanId = PlanId | 'free';

/**
 * Normalize a plan ID to ensure it matches our internal plan IDs
 * 
 * @param planId The plan ID to normalize
 * @returns The normalized plan ID
 */
export function normalizePlanId(planId: string): SubscriptionPlanId {
  // If the plan ID is directly in our mapping, return it
  if (PLAN_ID_MAPPING[planId]) {
    return PLAN_ID_MAPPING[planId];
  }
  
  // Otherwise, try to match by prefix
  for (const [key, value] of Object.entries(PLAN_ID_MAPPING)) {
    if (planId.startsWith(key.split('_')[0])) {
      return value;
    }
  }
  
  // Default to free if no match
  return 'free';
}

/**
 * Check if a user has access to a specific feature based on their subscription
 * 
 * @param subscription The user's subscription object
 * @param featureKey The feature to check access for
 * @param options Optional parameters to modify the behavior
 * @returns Boolean indicating if the user has access to the feature
 */
export function hasFeatureAccess(
  subscription: Subscription | null,
  featureKey: FeatureKey,
  options?: { isLoading?: boolean; hasJustSubscribed?: boolean }
): boolean {
  // If the user has just subscribed (based on URL parameters), grant access
  if (options?.hasJustSubscribed) {
    console.log('hasFeatureAccess - User has just subscribed, granting access to:', featureKey);
    return true;
  }

  // If subscription data is still loading, we need to be careful about denying access
  // For worksheet submission specifically, we'll check if there's a URL parameter indicating just subscribed
  if (options?.isLoading) {
    console.log('hasFeatureAccess - Subscription data is still loading for:', featureKey);
    
    // If we're on the client side and can access the URL
    if (typeof window !== 'undefined') {
      // Check URL parameters for subscription success indicators
      const urlParams = new URLSearchParams(window.location.search);
      const hasSubscriptionSuccess = urlParams.has('subscription') && urlParams.get('subscription') === 'success';
      
      if (hasSubscriptionSuccess) {
        console.log('hasFeatureAccess - Found subscription success parameter in URL, granting access to:', featureKey);
        return true;
      }
      
      // For worksheet submission, we'll be more lenient during loading
      if (featureKey === 'worksheetSubmit') {
        console.log('hasFeatureAccess - Special case for worksheetSubmit during loading, checking localStorage');
        // Check localStorage for any cached subscription status
        try {
          const cachedSubscription = localStorage.getItem('eric_subscription_cache');
          if (cachedSubscription) {
            const parsed = JSON.parse(cachedSubscription);
            if (parsed && (parsed.status === 'active' || parsed.status === 'past_due')) {
              console.log('hasFeatureAccess - Found valid cached subscription, granting access to:', featureKey);
              return true;
            }
          }
        } catch (e) {
          console.error('Error checking cached subscription:', e);
        }
      }
    }
    
    // If we're in a worksheet or tracker context, be more permissive during loading
    if (['worksheetSubmit', 'trackerCreate', 'trackerEntryUpdate', 'trackerReflectionUpdate'].includes(featureKey)) {
      console.log('hasFeatureAccess - Critical feature access during loading, granting provisional access to:', featureKey);
      return true; // Grant provisional access during loading for critical features
    }
    
    // For other features, we'll still show them during loading
    return true;
  }
  
  // If no subscription data is available (not loading), deny access
  if (subscription === null) {
    return false;
  }

  // Check if the subscription has a valid status for feature access
  // According to the User schema, only "active", "past_due", and "canceled" are valid statuses
  // We'll allow access for "active" and "past_due" (grace period)
  const validStatuses = ['active', 'past_due'];
  const hasValidStatus = validStatuses.includes(subscription.status);
  
  // If not in a valid status, deny access
  if (!hasValidStatus) {
    return false;
  }

  // Get the plan ID, default to free if not available
  const rawPlanId = subscription.planId || 'free';
  
  // Normalize the plan ID to ensure it matches our feature access map
  const normalizedPlanId = normalizePlanId(rawPlanId);
  
  // Debug log to help diagnose subscription issues
  console.log('hasFeatureAccess - Raw Plan ID:', rawPlanId);
  console.log('hasFeatureAccess - Normalized Plan ID:', normalizedPlanId);
  console.log('hasFeatureAccess - Feature Key:', featureKey);
  
  // Get the feature access map for the plan
  const planFeatures = FEATURE_ACCESS_MAP[normalizedPlanId as SubscriptionPlanId] || FEATURE_ACCESS_MAP.free;
  
  // Debug log for feature access
  console.log('hasFeatureAccess - Has Access:', planFeatures[featureKey] || false);
  
  // Return whether the feature is available for this plan
  return planFeatures[featureKey] || false;
}

/**
 * Check if a user has an active subscription
 * 
 * @param subscription The user's subscription object
 * @returns Boolean indicating if the user has an active subscription
 */
export function hasActiveSubscription(subscription: Subscription | null): boolean {
  // According to the User schema, valid statuses are "active", "past_due", and "canceled"
  // We consider both "active" and "past_due" as having an active subscription
  const validStatuses = ['active', 'past_due'];
  return subscription !== null && validStatuses.includes(subscription.status);
}

/**
 * Debug utility to help diagnose subscription issues
 * 
 * @param subscription The user's subscription object
 */
export function debugSubscription(subscription: Subscription | null): void {
  console.log('=== SUBSCRIPTION DEBUG ===');
  console.log('Subscription object:', subscription);
  
  if (!subscription) {
    console.log('No subscription data available');
    return;
  }
  
  console.log('Status:', subscription.status);
  console.log('Plan ID:', subscription.planId);
  console.log('Normalized Plan ID:', normalizePlanId(subscription.planId || 'free'));
  console.log('Current period start:', subscription.currentPeriodStart);
  console.log('Current period end:', subscription.currentPeriodEnd);
  console.log('Submissions this period:', subscription.submissionsThisPeriod);
  
  // Check if plan ID exists in feature access map
  const normalizedPlanId = normalizePlanId(subscription.planId || 'free');
  const planExists = Object.keys(FEATURE_ACCESS_MAP).includes(normalizedPlanId);
  console.log('Plan exists in FEATURE_ACCESS_MAP:', planExists);
  
  // Check feature access for all features
  Object.keys(FEATURE_ACCESS_MAP.free).forEach(feature => {
    const hasAccess = hasFeatureAccess(subscription, feature as FeatureKey);
    console.log(`Feature access - ${feature}:`, hasAccess);
  });
  
  console.log('=== END DEBUG ===');
}
