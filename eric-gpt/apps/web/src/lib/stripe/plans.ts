/**
 * Stripe plan configuration for the Eric GPT Coaching Platform
 * Based on the server-side configuration
 */

export type PlanId = 
  | 'foundation_monthly'
  | 'momentum_monthly'
  | 'legacy_monthly'
  | 'executive_monthly';

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  features?: {
   submissionsPerMonth?: number;
  };
  submissionLimit: number | null;
  teamSize?: number;
  priceId: string;
  billingCycle: 'monthly' | 'yearly';
}

// Plan definitions with features and pricing
export const STRIPE_PLANS: Record<PlanId, Plan> = {
  // Foundation Builder Plan
  foundation_monthly: {
    id: 'foundation_monthly',
    name: 'Foundation Builder',
    description: 'For early-stage leaders who want tools, structure, and momentum',
    price: 99,
    features: {
      submissionsPerMonth: 10
    },
    submissionLimit: 10,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDATION_MONTHLY || '',
    billingCycle: 'monthly'
  },
  
  // Momentum Maker Plan
  momentum_monthly: {
    id: 'momentum_monthly',
    name: 'Momentum Maker',
    description: 'For emerging leaders ready to go beyond tools and into transformation',
    price: 199,
    features: {
      submissionsPerMonth: 25
    },
    submissionLimit: 25,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MOMENTUM_MONTHLY || '',
    billingCycle: 'monthly'
  },
  
  // Legacy Leader Plan
  legacy_monthly: {
    id: 'legacy_monthly',
    name: 'Legacy Leader',
    description: 'For leaders who want coaching, connection, and a path to lasting impact',
    price: 499,
    features: {
      submissionsPerMonth: 40
    },
    submissionLimit: 40,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LEGACY_MONTHLY || '',
    billingCycle: 'monthly'
  },
  
  // Executive Accelerator Plan
  executive_monthly: {
    id: 'executive_monthly',
    name: 'Executive Accelerator',
    description: 'For high-potential leaders who want elite coaching, full accountability, and strategic alignment',
    price: 999,
    features: {},
    submissionLimit: null, // Unlimited
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_EXECUTIVE_MONTHLY || '',
    billingCycle: 'monthly'
  }
};

// Founding member discount (20%)
export const FOUNDING_MEMBER_COUPON = "founding_member_20";

/**
 * Get a plan by its ID
 */
export function getPlanById(planId: PlanId): Plan | undefined {
  return STRIPE_PLANS[planId];
}

/**
 * Get a plan by its Stripe Price ID
 */
export function getPlanByStripePriceId(stripePriceId: string): Plan | undefined {
  return Object.values(STRIPE_PLANS).find((plan) => plan.priceId === stripePriceId);
}

/**
 * Format a price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Check if a user has reached their submission limit
 */
export function hasReachedSubmissionLimit(
  submissionsThisPeriod: number,
  planId: PlanId
): boolean {
  const plan = getPlanById(planId);
  if (!plan) return true;
  if (plan.submissionLimit === null) return false; // Unlimited
  return submissionsThisPeriod >= plan.submissionLimit;
}

/**
 * Check if a plan is a team plan
 */
export function isTeamPlan(planId: PlanId): boolean {
  // No team plans in the new pricing model
  return false;
}

/**
 * Check if a plan has unlimited submissions
 */
export function hasUnlimitedSubmissions(planId: PlanId): boolean {
  return planId.startsWith('executive_');
}
