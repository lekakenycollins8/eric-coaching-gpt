import React, { useState } from 'react';
import { formatPrice, type PlanId } from '../../lib/stripe/plans';
import { type ProratedPrice } from '../../hooks/useSubscription';

interface SubscriptionButtonProps {
  planId: PlanId;
  isCurrentPlan: boolean;
  handleSubscribe: (planId: PlanId) => Promise<void>;
  calculateProratedPrice?: (planId: PlanId) => ProratedPrice | null;
  formatDate: (date: Date) => string;
}

export function SubscriptionButton({
  planId,
  isCurrentPlan,
  handleSubscribe,
  calculateProratedPrice,
  formatDate
}: SubscriptionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const proration = calculateProratedPrice ? calculateProratedPrice(planId) : null;
  
  if (isCurrentPlan) {
    return (
      <div className="mt-6">
        <div className="w-full flex justify-center items-center px-4 py-2 border-2 border-green-600 text-green-700 bg-green-50 rounded-md shadow-sm text-sm font-medium">
          <svg className="h-5 w-5 mr-2 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Current Plan
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      {/* Prorated pricing information */}
      {isHovered && proration && (
        <div className="mb-2 text-sm">
          <div className="p-2 rounded bg-gray-50 border border-gray-200">
            {proration.isUpgrade ? (
              <p className="text-green-700">
                You'll be charged {formatPrice(proration.proratedAmount)} now for the upgrade.
                <span className="block mt-1 text-xs text-gray-500">
                  Effective immediately
                </span>
              </p>
            ) : (
              <p className="text-blue-700">
                You'll save {formatPrice(proration.proratedAmount)} on your next billing cycle.
                <span className="block mt-1 text-xs text-gray-500">
                  Effective {formatDate(proration.effectiveDate)}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
      
      <button
        type="button"
        onClick={() => handleSubscribe(planId)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Subscribe
      </button>
    </div>
  );
}
