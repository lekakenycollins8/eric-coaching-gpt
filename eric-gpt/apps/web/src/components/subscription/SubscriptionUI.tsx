import React from 'react';
import { STRIPE_PLANS, formatPrice, type PlanId, getPlanByStripePriceId, getPlanById } from '../../lib/stripe/plans';
import type { Subscription, ProratedPrice } from '../../hooks/useSubscription';
import { SubscriptionButton } from './SubscriptionButton';

interface SubscriptionUIProps {
  subscription: Subscription | null;
  hasStripeCustomerId: boolean;
  loading: boolean;
  successMessage: string;
  errorMessage: string;
  handleManageSubscription: () => Promise<void>;
  handleSubscribe: (planId: PlanId) => Promise<void>;
  formatDate: (date: Date) => string;
  calculateProratedPrice?: (planId: PlanId) => ProratedPrice | null;
}

export function SubscriptionUI({
  subscription,
  hasStripeCustomerId,
  loading,
  successMessage,
  errorMessage,
  handleManageSubscription,
  handleSubscribe,
  formatDate,
  calculateProratedPrice
}: SubscriptionUIProps) {

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading subscription details...</p>
      </div>
    );
  }

  console.log('Subscription:', subscription);
  console.log('STRIPE_PLANS:', STRIPE_PLANS);

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
      {subscription && subscription.status ? (
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Current Subscription</h3>
            
            {(() => {
              // Use getPlanById instead of getPlanByStripePriceId since we're storing plan IDs, not price IDs
              const plan = getPlanById(subscription.planId as PlanId);
              console.log('Looking up plan with ID:', subscription.planId);
              console.log('Found plan:', plan);
              if (plan) {
                return (
                  <>
                    {/* Add plan name and billing cycle as a prominent element */}
                    <div className="mt-2">
                      <h4 className="text-xl font-semibold text-green-600">
                        {plan.name}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({plan.billingCycle === 'yearly' ? 'Annual' : 'Monthly'} billing)
                        </span>
                      </h4>
                    </div>

                    <div className="mt-4">
                      <div className="mt-1 text-sm text-gray-600 sm:flex sm:items-center">
                        <div>
                          <span className="font-medium">Plan: </span>
                          <span className="text-gray-900">
                            {plan.name}
                          </span>
                        </div>
                        <svg className="hidden sm:block mx-2 h-1 w-1 text-gray-500" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        <div className="flex items-center">
                          Status:
                          <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            subscription.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : subscription.status === 'past_due'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            <span className={`mr-1.5 h-2 w-2 rounded-full ${
                              subscription.status === 'active'
                                ? 'bg-green-500'
                                : subscription.status === 'past_due'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}></span>
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
                            {plan.features?.submissionsPerMonth && (
                              <div className="mt-2 sm:mt-0 text-sm text-gray-900">
                                Limit: <span className="font-medium">{plan.features?.submissionsPerMonth}</span>
                              </div>
                            )}
                          </div>
                          {/* Progress bar for submissions */}
                          {plan.features?.submissionsPerMonth && (
                            <div className="mt-3">
                              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                {(() => {
                                  const percentage = plan.features?.submissionsPerMonth ? 
                                    Math.min((subscription.submissionsThisPeriod / (plan.features?.submissionsPerMonth || 1)) * 100, 100) : 0;
                                  
                                  // Determine color based on usage percentage
                                  let colorClass = "bg-green-500";
                                  if (percentage >= 90) colorClass = "bg-red-500";
                                  else if (percentage >= 75) colorClass = "bg-yellow-500";
                                  
                                  return (
                                    <div
                                      style={{ width: `${percentage}%` }}
                                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${colorClass}`}
                                    ></div>
                                  );
                                })()}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 flex justify-between">
                                <span>{subscription.submissionsThisPeriod} used</span>
                                <span>{plan.features?.submissionsPerMonth} total</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              } else {
                return (
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>No Plan Selected</p>
                  </div>
                );
              }
            })()}
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
                          <li className="flex items-start">
                            <svg className="h-5 w-5 flex-shrink-0 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2 text-sm text-gray-500">{plan.features?.submissionsPerMonth} Submissions per month</span>
                          </li>
                      </ul>
                      <SubscriptionButton
                        planId={plan.id as PlanId}
                        isCurrentPlan={subscription?.planId === plan.id}
                        handleSubscribe={handleSubscribe}
                        calculateProratedPrice={calculateProratedPrice}
                        formatDate={formatDate}
                      />
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
                          <li className="flex items-start">
                            <svg className="h-5 w-5 flex-shrink-0 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2 text-sm text-gray-500">{plan.features?.submissionsPerMonth} Submissions per month</span>
                          </li>
                      </ul>
                      <SubscriptionButton
                        planId={plan.id as PlanId}
                        isCurrentPlan={subscription?.planId === plan.id}
                        handleSubscribe={handleSubscribe}
                        calculateProratedPrice={calculateProratedPrice}
                        formatDate={formatDate}
                      />
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
