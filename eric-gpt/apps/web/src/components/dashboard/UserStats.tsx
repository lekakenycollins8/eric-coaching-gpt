'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { STRIPE_PLANS, getPlanById, type PlanId } from '../../lib/stripe/plans';
import useQuota from '../../hooks/useQuota';
import { useSubscription } from '../../hooks/useSubscription';

interface UserStatsState {
  worksheetsCompleted: number;
  activeTrackers: number;
  subscriptionPlan: string;
  planId: string;
  isSubscribed: boolean;
  daysRemaining: number;
  status: string;
}

// Component to display user statistics and subscription status
export default function UserStats() {
  const { data: session } = useSession();
  const { used: worksheetsCompleted, isLoading: quotaLoading } = useQuota();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  
  // Derive stats from hooks
  const stats = React.useMemo(() => {
    let subscriptionPlan = 'Free Trial';
    let planId = '';
    let isSubscribed = false;
    let daysRemaining = 0;
    let status = '';
    
    if (subscription) {
      status = subscription.status;
      isSubscribed = status === 'active' || status === 'trialing';
      planId = subscription.planId || '';
      
      // Get plan details from the plan ID
      if (planId) {
        const plan = getPlanById(planId as PlanId);
        if (plan) {
          subscriptionPlan = plan.name;
        }
      }
      
      // Calculate days remaining
      const endDate = subscription.currentPeriodEnd;
      const now = new Date();
      daysRemaining = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
    
    // For now, active trackers is always 0 since we haven't implemented that feature yet
    const activeTrackers = 0;
    
    return {
      worksheetsCompleted,
      activeTrackers,
      subscriptionPlan,
      planId,
      isSubscribed,
      daysRemaining,
      status,
    };
  }, [worksheetsCompleted, subscription]);
  
  // Combined loading state
  const loading = quotaLoading || subscriptionLoading;

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium text-gray-900">Your Progress</h3>
        <p className="mt-1 text-sm text-gray-500">Track your coaching journey</p>
      </div>
      
      <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
        {/* Subscription Status Alert - Only show for users without an active subscription */}
        {!stats.isSubscribed && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Subscription Required</h3>
                <div className="mt-1 text-sm text-amber-700">
                  <p>A subscription is required to complete worksheets and receive AI coaching feedback.</p>
                </div>
                <div className="mt-2">
                  <Link
                    href="/dashboard/subscription"
                    className="inline-flex items-center px-3 py-1.5 border border-amber-700 text-sm font-medium rounded-md text-amber-800 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    Subscribe Now &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-green-500 mr-2" />
              <dt className="text-sm font-medium text-gray-500">Worksheets Completed</dt>
            </div>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats.worksheetsCompleted}</dd>
          </div>
          
          <div className="sm:col-span-1">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 text-green-500 mr-2" />
              <dt className="text-sm font-medium text-gray-500">Active Trackers</dt>
            </div>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats.activeTrackers}</dd>
          </div>
          
          <div className="sm:col-span-2 pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-2" />
              <dt className="text-sm font-medium text-gray-500">Subscription Plan</dt>
            </div>
            <dd className="mt-1 text-lg font-medium text-gray-900">
              {stats.isSubscribed ? (
                <>
                  <span className="text-green-600">
                    {stats.subscriptionPlan}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({stats.status === 'active' ? 'Active' : stats.status})
                  </span>
                  {stats.daysRemaining > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({stats.daysRemaining} days remaining)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-600">
                  {stats.subscriptionPlan}
                </span>
              )}
            </dd>
            <div className="mt-3">
              <Link 
                href="/dashboard/subscription" 
                className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${stats.isSubscribed ? 'border-green-600 text-green-700 bg-green-50 hover:bg-green-100' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
              >
                {stats.isSubscribed ? 'Manage subscription' : 'Subscribe now'} &rarr;
              </Link>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
