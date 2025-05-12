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
  
  return (
    <div className="mt-6">
      {/* Prorated pricing information */}
      {isHovered && !isCurrentPlan && proration && (
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
        className={`w-full inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${
          isCurrentPlan
            ? 'border-green-600 text-green-600 bg-white'
            : 'border-transparent text-white bg-green-600 hover:bg-green-700'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
      </button>
    </div>
  );
}
