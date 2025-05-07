'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import { STRIPE_PLANS, formatPrice, PlanId } from '../../../lib/stripe/plans';

export default function SubscriptionPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin?callbackUrl=/dashboard/subscription');
    },
  });

  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
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
  }, [status, session, searchParams]);

  const fetchSubscription = async () => {
    try {
      // In a real implementation, you would fetch the user's subscription from your API
      // For now, we'll simulate a response
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll pretend the user has a subscription
      // In a real implementation, this would come from your database
      const mockSubscription = {
        planId: 'solo_monthly' as PlanId,
        status: 'active',
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),   // 15 days from now
        submissionsThisPeriod: 4
      };
      
      setSubscription(mockSubscription);
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
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: session.user.id,
          email: session.user.email,
          successUrl: window.location.origin + '/dashboard/subscription?success=true',
          cancelUrl: window.location.origin + '/dashboard/subscription?canceled=true',
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setErrorMessage('Failed to create checkout session. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Helper function to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* Current Subscription */}
      {subscription ? (
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Current Subscription</h3>
            <div className="mt-5">
              <div className="rounded-md bg-gray-50 px-6 py-5 sm:flex sm:items-start sm:justify-between">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 sm:mt-0 sm:ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {STRIPE_PLANS[subscription.planId]?.name || 'Unknown Plan'}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 sm:flex sm:items-center">
                      <div>
                        Status: <span className={`font-medium ${subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </span>
                      </div>
                      <svg className="hidden sm:block mx-2 h-1 w-1 text-gray-500" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      <div>
                        Renews: <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleManageSubscription}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Manage subscription
                  </button>
                </div>
              </div>
              
              <div className="mt-5">
                <h4 className="text-sm font-medium text-gray-500">USAGE</h4>
                <div className="mt-2">
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="sm:flex sm:items-center sm:justify-between">
                      <div className="text-sm text-gray-900">
                        Submissions this period: <span className="font-medium">{subscription.submissionsThisPeriod}</span>
                      </div>
                      {STRIPE_PLANS[subscription.planId]?.submissionLimit && (
                        <div className="mt-2 sm:mt-0 text-sm text-gray-900">
                          Limit: <span className="font-medium">{STRIPE_PLANS[subscription.planId]?.submissionLimit || 'Unlimited'}</span>
                        </div>
                      )}
                    </div>
                    {STRIPE_PLANS[subscription.planId]?.submissionLimit && (
                      <div className="mt-3">
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                            <div
                              style={{
                                width: `${Math.min(
                                  (subscription.submissionsThisPeriod / (STRIPE_PLANS[subscription.planId]?.submissionLimit || 1)) * 100,
                                  100
                                )}%`,
                              }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">No Active Subscription</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>You don't currently have an active subscription. Choose a plan below to get started.</p>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Available Plans</h3>
          
          {/* Monthly Plans */}
          <div className="mt-5">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Monthly Billing</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Object.values(STRIPE_PLANS)
                .filter(plan => plan.billingCycle === 'monthly')
                .map((plan) => (
                  <div key={plan.id} className="relative rounded-lg border border-gray-300 bg-white px-5 py-4 shadow-sm hover:border-gray-400">
                    <div className="flex flex-col h-full">
                      <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                      <p className="mt-2 flex items-baseline">
                        <span className="text-2xl font-bold tracking-tight text-gray-900">{formatPrice(plan.price)}</span>
                        <span className="ml-1 text-sm text-gray-500">/month</span>
                      </p>
                      <ul className="mt-4 space-y-2 flex-grow">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="h-5 w-5 flex-shrink-0 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2 text-sm text-gray-500">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => handleSubscribe(plan.id as PlanId)}
                          className={`w-full inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${
                            subscription?.planId === plan.id
                              ? 'border-green-600 text-green-600 bg-white'
                              : 'border-transparent text-white bg-green-600 hover:bg-green-700'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                          disabled={subscription?.planId === plan.id}
                        >
                          {subscription?.planId === plan.id ? 'Current Plan' : 'Subscribe'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          {/* Yearly Plans */}
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Annual Billing (Save 15%)</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Object.values(STRIPE_PLANS)
                .filter(plan => plan.billingCycle === 'yearly')
                .map((plan) => (
                  <div key={plan.id} className="relative rounded-lg border border-gray-300 bg-white px-5 py-4 shadow-sm hover:border-gray-400">
                    <div className="flex flex-col h-full">
                      <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                      <p className="mt-2 flex items-baseline">
                        <span className="text-2xl font-bold tracking-tight text-gray-900">{formatPrice(plan.price)}</span>
                        <span className="ml-1 text-sm text-gray-500">/year</span>
                      </p>
                      <ul className="mt-4 space-y-2 flex-grow">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="h-5 w-5 flex-shrink-0 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2 text-sm text-gray-500">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => handleSubscribe(plan.id as PlanId)}
                          className={`w-full inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${
                            subscription?.planId === plan.id
                              ? 'border-green-600 text-green-600 bg-white'
                              : 'border-transparent text-white bg-green-600 hover:bg-green-700'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                          disabled={subscription?.planId === plan.id}
                        >
                          {subscription?.planId === plan.id ? 'Current Plan' : 'Subscribe'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
