import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { STRIPE_PLANS, formatPrice, type PlanId } from '../lib/stripe/plans';

export interface Subscription {
  id: string;
  status: string;
  planId: PlanId;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  submissionsThisPeriod: number;
}

export interface ProratedPrice {
  currentPlan: string;
  newPlan: string;
  proratedAmount: number;
  daysRemaining: number;
  totalDays: number;
  isUpgrade: boolean;
  effectiveDate: Date;
}

export function useSubscription() {
  const { data: session, status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasStripeCustomerId, setHasStripeCustomerId] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Check if the URL indicates a successful subscription
  const hasJustSubscribed = searchParams.get('success') === 'true' || searchParams.get('subscribed') === 'true';

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.id) {
      fetchSubscription();
    }

    // Check for success or canceled URL parameters
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('Your subscription has been successfully updated!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } else if (searchParams.get('canceled') === 'true') {
      setErrorMessage('Subscription update was canceled.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  }, [authStatus, session?.user?.id, searchParams]);

  // Function to refresh subscription data
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      
      // Fetch the user's actual subscription data from the API
      const response = await fetch('/api/user/subscription', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch subscription data');
      }
      
      const data = await response.json();
      console.log('Subscription data:', data);
      
      // Check if the user has a Stripe customer ID
      setHasStripeCustomerId(!!data.stripeCustomerId);
      
      // Only process subscription data if the user actually has a subscription
      // with valid data (has a status field at minimum AND status is valid)
      // Valid statuses include: active, past_due (still has access)
      // Note: According to the User schema, only "active", "past_due", and "canceled" are valid statuses
      const validStatuses = ['active', 'past_due'];
      if (data.subscription && data.subscription.status && validStatuses.includes(data.subscription.status)) {
        // Convert date strings to Date objects and handle potential invalid dates
        const subscription = {
          ...data.subscription,
          // Only use planId if it exists, don't add a default for new accounts
          planId: data.subscription.planId || '',
          // Safely convert dates with validation
          currentPeriodStart: data.subscription.currentPeriodStart ? 
            new Date(data.subscription.currentPeriodStart) : 
            new Date(),
          currentPeriodEnd: data.subscription.currentPeriodEnd ? 
            new Date(data.subscription.currentPeriodEnd) : 
            new Date(),
          // Ensure submissions count exists
          submissionsThisPeriod: data.subscription.submissionsThisPeriod || 0
        };
        
        // Log the processed subscription for debugging
        console.log('Processed subscription:', subscription);
        
        setSubscription(subscription);
      } else {
        // User doesn't have an active subscription
        setSubscription(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          returnUrl: window.location.origin + '/dashboard/subscription',
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      setErrorMessage('Failed to access the customer portal. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleSubscribe = async (planId: PlanId) => {
    if (!session?.user?.id) {
      console.log('No user ID found in session', session);
      return;
    }
    
    try {
      console.log('Subscribing to plan:', planId);
      console.log('User ID:', session.user.id);
      console.log('Email:', session.user.email);
      
      const payload = {
        planId,
        userId: session.user.id,
        email: session.user.email,
        successUrl: window.location.origin + '/dashboard/subscription?success=true',
        cancelUrl: window.location.origin + '/dashboard/subscription?canceled=true',
      };
      
      console.log('Checkout payload:', JSON.stringify(payload, null, 2));
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      console.log('Checkout response:', JSON.stringify(data, null, 2));
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setErrorMessage('Failed to initiate checkout. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Helper function to format date
  const formatDate = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Use the native toLocaleDateString method which is more reliable
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate prorated price for changing subscription plans
  const calculateProratedPrice = (newPlanId: PlanId): ProratedPrice | null => {
    if (!subscription) return null;
    
    // Get current and new plan details
    const currentPlan = STRIPE_PLANS[subscription.planId];
    const newPlan = STRIPE_PLANS[newPlanId];
    
    if (!currentPlan || !newPlan) return null;
    
    // Calculate days remaining in current billing period
    const now = new Date();
    const endDate = subscription.currentPeriodEnd;
    const startDate = subscription.currentPeriodStart;
    
    const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate prorated amount
    const currentDailyRate = currentPlan.price / totalDays;
    const newDailyRate = newPlan.price / totalDays;
    
    const remainingValueCurrent = currentDailyRate * daysRemaining;
    const remainingValueNew = newDailyRate * daysRemaining;
    
    // If upgrading, customer pays the difference immediately
    // If downgrading, customer gets credit on next billing cycle
    const proratedAmount = remainingValueNew - remainingValueCurrent;
    const isUpgrade = proratedAmount > 0;
    
    // Calculate effective date (immediate for upgrades, next billing cycle for downgrades)
    const effectiveDate = isUpgrade ? now : new Date(endDate);
    
    return {
      currentPlan: currentPlan.name,
      newPlan: newPlan.name,
      proratedAmount: Math.abs(proratedAmount),
      daysRemaining,
      totalDays,
      isUpgrade,
      effectiveDate
    };
  };

  return {
    subscription,
    hasStripeCustomerId,
    loading,
    successMessage,
    errorMessage,
    authStatus,
    handleManageSubscription,
    handleSubscribe,
    formatDate,
    calculateProratedPrice,
    fetchSubscription,
    hasJustSubscribed
  };
}
