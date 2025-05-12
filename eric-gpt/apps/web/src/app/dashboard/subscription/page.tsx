'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSubscription } from '../../../hooks/useSubscription';
import { SubscriptionUI } from '../../../components/subscription/SubscriptionUI';

export default function SubscriptionPage() {
  // Authentication check with redirection
  useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin?callbackUrl=/dashboard/subscription');
    },
  });

  // Use the custom hook that contains all subscription logic
  const {
    subscription,
    hasStripeCustomerId,
    loading,
    successMessage,
    errorMessage,
    authStatus,
    handleManageSubscription,
    handleSubscribe,
    formatDate,
    calculateProratedPrice
  } = useSubscription();

  // If still loading auth or subscription data, show loading spinner
  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading subscription details...</p>
      </div>
    );
  }

  // Render the UI component with all the subscription data and handlers
  return (
    <SubscriptionUI
      subscription={subscription}
      hasStripeCustomerId={hasStripeCustomerId}
      loading={loading}
      successMessage={successMessage}
      errorMessage={errorMessage}
      handleManageSubscription={handleManageSubscription}
      handleSubscribe={handleSubscribe}
      formatDate={formatDate}
      calculateProratedPrice={calculateProratedPrice}
    />
  );
}
