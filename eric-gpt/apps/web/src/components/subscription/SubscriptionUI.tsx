import React from 'react';
import { STRIPE_PLANS, formatPrice, type PlanId } from '../../lib/stripe/plans';
import type { Subscription } from '../../hooks/useSubscription';

interface SubscriptionUIProps {
  subscription: Subscription | null;
  hasStripeCustomerId: boolean;
  loading: boolean;
  successMessage: string;
  errorMessage: string;
  handleManageSubscription: () => Promise<void>;
  handleSubscribe: (planId: PlanId) => Promise<void>;
  formatDate: (date: Date) => string;
}

export function SubscriptionUI({
  subscription,
  hasStripeCustomerId,
  loading,
  successMessage,
  errorMessage,
  handleManageSubscription,
  handleSubscribe,
  formatDate
}: SubscriptionUIProps) {
  if (loading) {
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
            <h3 className="text-lg leading-6 font-medium text-gray-900">Current Subscription</h3>
            
            {/* Add plan name and billing cycle as a prominent element */}
            <div className="mt-2">
              {/* Debug information - remove after fixing */}
              <div className="text-xs text-gray-500 mb-2">
                Plan ID: {subscription.planId || 'No plan ID'} | 
                Available Plans: {Object.keys(STRIPE_PLANS).join(', ')}
              </div>
              <h4 className="text-xl font-semibold text-green-600">
                {(() => {
                  // Try to find the plan by exact ID match
                  const plan = STRIPE_PLANS[subscription.planId];
                  if (plan) return plan.name;
                  
                  // If no exact match, try to find a plan with a similar ID
                  // This handles cases where the stored ID might be slightly different
                  // (e.g., if the server uses a different ID format)
                  const planId = subscription.planId || '';
                  if (planId.includes('solo')) return 'Solo Leader';
                  if (planId.includes('pro')) return 'Pro Builder';
                  if (planId.includes('vip')) return 'Executive VIP';
                  
                  // Fallback
                  return 'Active Plan';
                })()}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {(() => {
                    const plan = STRIPE_PLANS[subscription.planId];
                    if (plan) return `(${plan.billingCycle === 'yearly' ? 'Annual' : 'Monthly'} billing)`;
                    
                    // Fallback if we can't determine the billing cycle
                    const planId = subscription.planId || '';
                    return planId.includes('yearly') ? '(Annual billing)' : '(Monthly billing)';
                  })()}
                </span>
              </h4>
            </div>
            
            <div className="mt-4">
              <div className="mt-1 text-sm text-gray-600 sm:flex sm:items-center">
                <div>
                  Status: <span className={`font-medium ${subscription.status === 'active' ? 'text-green-600' : subscription.status === 'past_due' ? 'text-yellow-600' : 'text-red-600'}`}>
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
              <div className="mt-4 flex">
                {hasStripeCustomerId && (
                  <div className="mt-4 sm:mt-0 sm:flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleManageSubscription}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Manage subscription
                    </button>
                  </div>
                )}
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
                    {STRIPE_PLANS[subscription.planId]?.features && (
                      <div className="mt-2 sm:mt-0 text-sm text-gray-900">
                        {/* Extract submission limit from features */}
                        {(() => {
                          const feature = STRIPE_PLANS[subscription.planId]?.features.find(f => f.includes('submissions'));
                          const limit = feature?.match(/\d+/)?.[0];
                          return limit ? (
                            <>Limit: <span className="font-medium">{limit}</span></>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                  {/* Progress bar for submissions */}
                  {(() => {
                    const feature = STRIPE_PLANS[subscription.planId]?.features.find(f => f.includes('submissions'));
                    const limit = parseInt(feature?.match(/\d+/)?.[0] || '0');
                    if (limit > 0) {
                      return (
                        <div className="mt-3">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                            <div
                              style={{
                                width: `${Math.min(
                                  (subscription.submissionsThisPeriod / limit) * 100,
                                  100
                                )}%`,
                              }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                            ></div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>You don't currently have an active subscription. Choose a plan below to get started.</p>
        </div>
      )}

      {/* Available Plans */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Available Plans</h3>
          
          {/* Monthly Plans */}
          <div>
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
