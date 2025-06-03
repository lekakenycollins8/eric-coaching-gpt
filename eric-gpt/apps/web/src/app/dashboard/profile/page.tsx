'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import QuotaDisplayClient from '@/components/dashboard/QuotaDisplayClient';
import { Loader2, ExternalLink } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { STRIPE_PLANS } from '@/lib/stripe/plans';

export default function ProfilePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin?callbackUrl=/dashboard/profile');
    },
  });
  
  const {
    subscription,
    loading: subscriptionLoading,
    handleManageSubscription,
    formatDate
  } = useSubscription();

  if (status === 'loading' || subscriptionLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <p className="mt-4 text-lg">Loading profile...</p>
      </div>
    );
  }

  const user = session?.user;
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
                  <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user?.name || 'User'}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Account Information</h3>
                    <Separator className="my-2" />
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">User ID</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user?.id}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date().toLocaleDateString()} {/* Replace with actual creation date when available */}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <QuotaDisplayClient />
            
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Your current plan and billing information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Current Plan:</span>
                    <span className="text-sm font-semibold">
                      {subscription?.planId ? 
                        (() => {
                          const plan = STRIPE_PLANS[subscription.planId];
                          return plan ? 
                            <>
                              {plan.name}
                              <span className="ml-1 text-xs text-gray-500">
                                ({plan.billingCycle === 'yearly' ? 'Annual' : 'Monthly'})
                              </span>
                            </> : 'Unknown Plan';
                        })() : 'Free Tier'}
                    </span>
                  </div>
                  
                  {subscription?.status && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <span className={`text-xs inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                        subscription.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : subscription.status === 'past_due'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        <span className={`mr-1 h-2 w-2 rounded-full ${
                          subscription.status === 'active'
                            ? 'bg-green-500'
                            : subscription.status === 'past_due'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}></span>
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </div>
                  )}
                  
                  {subscription?.currentPeriodEnd && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Renews:</span>
                      <span className="text-sm">
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                  )}
                  
                  <Separator className="my-3" />
                  
                  <div className="pt-2">
                    <Button 
                      onClick={handleManageSubscription} 
                      className="w-full" 
                      variant="outline"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Manage Subscription
                    </Button>
                  </div>
                  
                  <div className="pt-2 text-xs text-muted-foreground">
                    {subscription ? (
                      <p>You can manage your billing details, update payment methods, or cancel your subscription through the Stripe customer portal.</p>
                    ) : (
                      <p>Visit the <a href="/dashboard/subscription" className="text-primary hover:text-primary/80 font-medium">subscription page</a> to view available plans and upgrade your account.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
