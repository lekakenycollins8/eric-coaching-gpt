import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { type PlanId } from '../lib/stripe/plans';

export interface Subscription {
  id: string;
  status: string;
  planId: PlanId;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  submissionsThisPeriod: number;
}

export function useSubscription() {
  const { data: session, status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasStripeCustomerId, setHasStripeCustomerId] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
  }, [authStatus, session, searchParams]);

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
      
      if (data.subscription) {
        // Convert date strings to Date objects and handle potential invalid dates
        const subscription = {
          ...data.subscription,
          // Ensure planId exists with a fallback
          planId: data.subscription.planId || 'solo_monthly', // Default to solo_monthly if missing
          // Safely convert dates with validation
          currentPeriodStart: data.subscription.currentPeriodStart ? 
            new Date(data.subscription.currentPeriodStart) : 
            new Date(),
          currentPeriodEnd: data.subscription.currentPeriodEnd ? 
            new Date(data.subscription.currentPeriodEnd) : 
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
          // Ensure submissions count exists
          submissionsThisPeriod: data.subscription.submissionsThisPeriod || 0
        };
        
        // Log the processed subscription for debugging
        console.log('Processed subscription:', subscription);
        
        setSubscription(subscription);
      } else {
        // User doesn't have a subscription yet
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
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
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

  return {
    subscription,
    hasStripeCustomerId,
    loading,
    successMessage,
    errorMessage,
    authStatus,
    handleManageSubscription,
    handleSubscribe,
    formatDate
  };
}
