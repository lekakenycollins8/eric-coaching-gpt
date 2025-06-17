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
import { Alert, AlertDescription } from '@/components/ui/alert';

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
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">Preferences</h3>
                    <Separator className="my-2" />
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        Customize your experience with Coach Eric GPT. More preference options coming soon.
                      </p>
                      <div className="mt-4">
                        <Button variant="outline" className="mr-2">
                          Edit Profile
                        </Button>
                      </div>
                    </div>
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
                  {subscription?.status === 'active' ? (
                    <>
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
                            })() : 'Unknown Plan'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <span className="text-xs inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                          <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                          Active
                        </span>
                      </div>
                      
                      {subscription?.currentPeriodEnd && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Renews:</span>
                          <span className="text-sm">
                            {formatDate(subscription.currentPeriodEnd)}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertDescription>
                        <div className="font-medium mb-1">No Active Subscription</div>
                        <p className="text-sm">You currently don't have an active subscription. Subscribe to unlock premium features including worksheet submissions and trackers.</p>
                      </AlertDescription>
                    </Alert>
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
                    {subscription?.status === 'active' ? (
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
