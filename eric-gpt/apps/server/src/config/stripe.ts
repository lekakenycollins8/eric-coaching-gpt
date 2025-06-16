/**
 * Stripe configuration for the Eric GPT Coaching Platform
 * Contains plan IDs and pricing information
 */

export const STRIPE_PLANS = {
  // Foundation Builder Plan
  FOUNDATION_MONTHLY: {
    id: "foundation_monthly",
    name: "Foundation Builder",
    limit: 10,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDATION_MONTHLY || "", // Foundation Monthly Plan Price ID
  },
  
  // Momentum Maker Plan
  MOMENTUM_MONTHLY: {
    id: "momentum_monthly",
    name: "Momentum Maker",
    limit: 25,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MOMENTUM_MONTHLY || "", // Momentum Monthly Plan Price ID
  },
  
  // Legacy Leader Plan
  LEGACY_MONTHLY: {
    id: "legacy_monthly",
    name: "Legacy Leader",
    limit: 40,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LEGACY_MONTHLY || "", // Legacy Monthly Plan Price ID
  },
  
  // Executive Accelerator Plan
  EXECUTIVE_MONTHLY: {
    id: "executive_monthly",
    name: "Executive Accelerator",
    limit: null, // Unlimited
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_EXECUTIVE_MONTHLY || "", // Executive Monthly Plan Price ID
  },
};

// Founding member discount (20%)
export const FOUNDING_MEMBER_COUPON = "founding_member_20";

// Helper function to get plan details by ID
export function getPlanById(planId: string) {
  const plans = Object.values(STRIPE_PLANS);
  return plans.find(plan => plan.id === planId);
}

// Helper function to get plan details by Stripe price ID
export function getPlanByPriceId(priceId: string) {
  console.log('Looking for plan with priceId:', priceId);
  console.log('Available price IDs:', Object.values(STRIPE_PLANS).map(p => p.priceId));
  
  // Convert plans object to array and find the matching plan
  for (const key in STRIPE_PLANS) {
    // Use type assertion to fix TypeScript error
    const plan = STRIPE_PLANS[key as keyof typeof STRIPE_PLANS];
    if (plan.priceId === priceId) {
      console.log('Found matching plan:', plan);
      return plan;
    }
  }
  
  // If no match is found, try to determine the plan by price amount
  console.log('No direct match found for price ID:', priceId);
  
  // If we still couldn't map the price ID to a plan, use a direct mapping approach
  console.log('Could not map price ID to plan using getPlanByPriceId');
  
  // Direct mapping of known price IDs to plan IDs using environment variables
  const priceToPlanMapping: Record<string, string> = {};
  
  // Dynamically build the mapping from environment variables
  if (process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDATION_MONTHLY) {
    priceToPlanMapping[process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDATION_MONTHLY] = 'foundation_monthly';
  }
  if (process.env.NEXT_PUBLIC_STRIPE_PRICE_MOMENTUM_MONTHLY) {
    priceToPlanMapping[process.env.NEXT_PUBLIC_STRIPE_PRICE_MOMENTUM_MONTHLY] = 'momentum_monthly';
  }
  if (process.env.NEXT_PUBLIC_STRIPE_PRICE_LEGACY_MONTHLY) {
    priceToPlanMapping[process.env.NEXT_PUBLIC_STRIPE_PRICE_LEGACY_MONTHLY] = 'legacy_monthly';
  }
  if (process.env.NEXT_PUBLIC_STRIPE_PRICE_EXECUTIVE_MONTHLY) {
    priceToPlanMapping[process.env.NEXT_PUBLIC_STRIPE_PRICE_EXECUTIVE_MONTHLY] = 'executive_monthly';
  }
  
  // Try to find the plan using the direct mapping
  const planId = priceToPlanMapping[priceId];
  if (planId) {
    return getPlanById(planId);
  }
  
  return null;
}

// Helper function to check if a plan is a team plan
export function isTeamPlan(planId: string) {
  // No team plans in the new pricing model
  return false;
}

// Helper function to check if a plan has unlimited submissions
export function hasUnlimitedSubmissions(planId: string) {
  return planId.startsWith('executive_');
}
