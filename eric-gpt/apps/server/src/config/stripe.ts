/**
 * Stripe configuration for the Eric GPT Coaching Platform
 * Contains plan IDs and pricing information
 */

export const STRIPE_PLANS = {
  // Solo Leader Plan
  SOLO_MONTHLY: {
    id: "solo_monthly",
    name: "Solo Leader Monthly",
    limit: 10,
    priceId: "price_1RMCyVP1DJ8H8ccarTX30pgj", // Solo Monthly Plan Price ID
  },
  SOLO_YEARLY: {
    id: "solo_yearly",
    name: "Solo Leader Yearly",
    limit: 10,
    priceId: "price_1RMCyVP1DJ8H8ccaFG3rYjz9", // Solo Yearly Plan Price ID
  },
  
  // Pro Builder Plan
  PRO_MONTHLY: {
    id: "pro_monthly",
    name: "Pro Builder Monthly",
    limit: 40,
    teamSize: 5,
    priceId: "price_1RMD3MP1DJ8H8ccaRa5Mc4TR", // Pro Monthly Plan Price ID
  },
  PRO_YEARLY: {
    id: "pro_yearly",
    name: "Pro Builder Yearly",
    limit: 40,
    teamSize: 5,
    priceId: "price_1RMD4AP1DJ8H8ccaKSuVZrNR", // Pro Yearly Plan Price ID
  },
  
  // Executive VIP Plan
  VIP_MONTHLY: {
    id: "vip_monthly",
    name: "Executive VIP Monthly",
    limit: null, // Unlimited
    priceId: "price_1RMD4jP1DJ8H8ccaYCqHj8t4", // VIP Monthly Plan Price ID
  },
  VIP_YEARLY: {
    id: "vip_yearly",
    name: "Executive VIP Yearly",
    limit: null, // Unlimited
    priceId: "price_1RMD5AP1DJ8H8ccaJ5QrFOzq", // VIP Yearly Plan Price ID
  },
};

// Founding member discount (20%)
export const FOUNDING_MEMBER_COUPON = "founding_member_20";

// Helper function to get plan details by ID
export function getPlanById(planId: string) {
  const plans = Object.values(STRIPE_PLANS);
  return plans.find(plan => plan.id === planId);
}

// Helper function to check if a plan is a team plan
export function isTeamPlan(planId: string) {
  return planId.startsWith('pro_');
}

// Helper function to check if a plan has unlimited submissions
export function hasUnlimitedSubmissions(planId: string) {
  return planId.startsWith('vip_');
}
