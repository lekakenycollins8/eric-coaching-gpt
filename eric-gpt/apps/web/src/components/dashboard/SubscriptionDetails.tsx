'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { STRIPE_PLANS, getPlanById } from '../../../lib/stripe/plans';

interface SubscriptionDetailsProps {
  subscription?: {
    planId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    submissionsThisPeriod: number;
  };
  userId: string;
}

export default function SubscriptionDetails({ subscription, userId }: SubscriptionDetailsProps) {
  const router = useRouter();
  
  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          returnUrl: window.location.origin + '/dashboard/subscription',
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
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

  // Get plan details if subscription exists
  const currentPlan = subscription?.planId 
    ? STRIPE_PLANS.find(plan => plan.id === subscription.planId) 
    : null;

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Subscription</h3>
        
        {subscription ? (
          <div className="mt-5">
            <div className="rounded-md bg-gray-50 px-6 py-5 sm:flex sm:items-start sm:justify-between">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 sm:mt-0 sm:ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {currentPlan?.name || 'Unknown Plan'}
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
                    {currentPlan && (
                      <div className="mt-2 sm:mt-0 text-sm text-gray-900">
                        Limit: <span className="font-medium">{currentPlan.features?.submissionsPerMonth || 'Unlimited'}</span>
                      </div>
                    )}
                  </div>
                  {currentPlan && currentPlan.features?.submissionsPerMonth && (
                    <div className="mt-3">
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                          <div
                            style={{
                              width: `${Math.min(
                                (subscription.submissionsThisPeriod / currentPlan.features.submissionsPerMonth) * 100,
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
        ) : (
          <div className="mt-5">
            <p className="text-sm text-gray-500">You don't have an active subscription.</p>
            
            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Available Plans</h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {STRIPE_PLANS.filter(plan => !plan.id.includes('yearly')).map((plan) => (
                  <div key={plan.id} className="relative rounded-lg border border-gray-300 bg-white px-5 py-4 shadow-sm hover:border-gray-400">
                    <div className="flex flex-col h-full">
                      <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                      <p className="mt-2 flex items-baseline">
                        <span className="text-2xl font-bold tracking-tight text-gray-900">${plan.price / 100}</span>
                        <span className="ml-1 text-sm text-gray-500">/month</span>
                      </p>
                      <ul className="mt-4 space-y-2 flex-grow">
                        {plan.features && Object.entries(plan.features).map(([key, value]) => (
                          <li key={key} className="flex items-start">
                            <svg className="h-5 w-5 flex-shrink-0 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2 text-sm text-gray-500">
                              {key === 'submissionsPerMonth' 
                                ? `${value} submissions/month` 
                                : value.toString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => handleSubscribe(plan.id)}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Subscribe
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
