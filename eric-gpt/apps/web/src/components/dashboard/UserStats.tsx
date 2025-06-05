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

interface UserStatsState {
  worksheetsCompleted: number;
  activeTrackers: number;
  subscriptionPlan: string;
  isSubscribed: boolean;
  daysRemaining: number;
}

// Component to display user statistics and subscription status
export default function UserStats() {
  const { data: session } = useSession();
  const [stats, setStats] = React.useState<UserStatsState>({
    worksheetsCompleted: 0,
    activeTrackers: 0,
    subscriptionPlan: 'Loading...',
    isSubscribed: false,
    daysRemaining: 0,
  });
  const [loading, setLoading] = React.useState(true);

  // Fetch user statistics from API
  React.useEffect(() => {
    if (session?.user?.id) {
      const fetchUserStats = async () => {
        try {
          // Fetch submissions count
          const submissionsResponse = await fetch('/api/submissions?limit=1');
          
          if (!submissionsResponse.ok) {
            throw new Error('Failed to fetch submissions data');
          }
          
          const submissionsData = await submissionsResponse.json();
          const worksheetsCompleted = submissionsData.total || 0;
          
          // Fetch subscription data
          // In a real implementation, we would have a dedicated endpoint for this
          // For now, we'll extract what we can from the quota endpoint
          const subscriptionData = submissionsData.subscription || {};
          const subscriptionPlan = subscriptionData.plan || 'Free Trial';
          const isSubscribed = subscriptionPlan !== 'Free Trial';
          
          // Calculate days remaining in subscription
          // This would be more accurate in a real implementation
          const daysRemaining = subscriptionData.daysRemaining || 0;
          
          // For now, active trackers is always 0 since we haven't implemented that feature yet
          const activeTrackers = 0;
          
          setStats({
            worksheetsCompleted,
            activeTrackers,
            subscriptionPlan,
            isSubscribed,
            daysRemaining,
          });
        } catch (error) {
          console.error('Error fetching user stats:', error);
          // Set default values on error
          setStats({
            worksheetsCompleted: 0,
            activeTrackers: 0,
            subscriptionPlan: 'Free Trial',
            isSubscribed: false,
            daysRemaining: 0,
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserStats();
    }
  }, [session]);

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
        {/* Subscription Status Alert */}
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
                    className="text-sm font-medium text-amber-800 hover:text-amber-700"
                  >
                    Upgrade now &rarr;
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
              <span className={stats.isSubscribed ? 'text-green-600' : 'text-gray-600'}>
                {stats.subscriptionPlan}
              </span>
              {stats.daysRemaining > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({stats.daysRemaining} days remaining)
                </span>
              )}
            </dd>
            <div className="mt-3">
              <Link 
                href="/dashboard/subscription" 
                className="text-sm font-medium text-green-600 hover:text-green-500"
              >
                {stats.isSubscribed ? 'Manage subscription →' : 'Upgrade now →'}
              </Link>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
