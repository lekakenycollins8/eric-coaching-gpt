/**
 * Stripe plan configuration for the Eric GPT Coaching Platform
 * Based on the server-side configuration
 */

export type PlanId = 
  | 'solo_monthly' 
  | 'solo_yearly' 
  | 'pro_monthly' 
  | 'pro_yearly' 
  | 'vip_monthly' 
  | 'vip_yearly';

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  features: string[];
  submissionLimit: number | null;
  teamSize?: number;
  priceId: string;
  billingCycle: 'monthly' | 'yearly';
}

// Plan definitions with features and pricing
export const STRIPE_PLANS: Record<PlanId, Plan> = {
  // Solo Leader Plan
  solo_monthly: {
    id: 'solo_monthly',
    name: 'Solo Leader',
    description: 'Perfect for individual leaders looking to improve their skills',
    price: 29.99,
    features: [
      'Access to 5 core worksheets',
      'Basic AI coaching feedback',
      'Email support',
      'Monthly billing'
    ],
    submissionLimit: 10,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO_MONTHLY || '',
    billingCycle: 'monthly'
  },
  solo_yearly: {
    id: 'solo_yearly',
    name: 'Solo Leader (Annual)',
    description: 'Perfect for individual leaders looking to improve their skills',
    price: 299.99, // Save ~$60 compared to monthly
    features: [
      'Access to 5 core worksheets',
      'Basic AI coaching feedback',
      'Email support',
      'Annual billing (save 15%)'
    ],
    submissionLimit: 10,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO_YEARLY || '',
    billingCycle: 'yearly'
  },
  
  // Pro Builder Plan
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Builder',
    description: 'Ideal for team leaders and growing organizations',
    price: 99.99,
    features: [
      'Access to all 12 worksheets',
      'Advanced AI coaching feedback',
      'Priority email support',
      'Monthly progress reports',
      'Team access for up to 5 members',
      'Monthly billing'
    ],
    submissionLimit: 40,
    teamSize: 5,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
    billingCycle: 'monthly'
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Builder (Annual)',
    description: 'Ideal for team leaders and growing organizations',
    price: 999.99, // Save ~$200 compared to monthly
    features: [
      'Access to all 12 worksheets',
      'Advanced AI coaching feedback',
      'Priority email support',
      'Monthly progress reports',
      'Team access for up to 5 members',
      'Annual billing (save 15%)'
    ],
    submissionLimit: 40,
    teamSize: 5,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
    billingCycle: 'yearly'
  },
  
  // Executive VIP Plan
  vip_monthly: {
    id: 'vip_monthly',
    name: 'Executive VIP',
    description: 'Complete solution for executive leadership development',
    price: 199.99,
    features: [
      'Unlimited access to all content',
      'Premium AI coaching with personalized insights',
      'Priority support with 24-hour response time',
      'Executive analytics and reporting',
      'Custom organization dashboard',
      'Monthly billing'
    ],
    submissionLimit: null, // Unlimited
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_MONTHLY || '',
    billingCycle: 'monthly'
  },
  vip_yearly: {
    id: 'vip_yearly',
    name: 'Executive VIP (Annual)',
    description: 'Complete solution for executive leadership development',
    price: 1999.99, // Save ~$400 compared to monthly
    features: [
      'Unlimited access to all content',
      'Premium AI coaching with personalized insights',
      'Priority support with 24-hour response time',
      'Executive analytics and reporting',
      'Custom organization dashboard',
      'Annual billing (save 15%)'
    ],
    submissionLimit: null, // Unlimited
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_YEARLY || '',
    billingCycle: 'yearly'
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
  return planId.startsWith('pro_');
}

/**
 * Check if a plan has unlimited submissions
 */
export function hasUnlimitedSubmissions(planId: PlanId): boolean {
  return planId.startsWith('vip_');
}
