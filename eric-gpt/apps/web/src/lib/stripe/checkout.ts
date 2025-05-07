/**
 * Client-side utilities for initiating Stripe checkout sessions
 */
import { getStripe } from './client';
import type { Session } from 'next-auth';

/**
 * Redirects the user to a Stripe checkout page for the specified plan
 */
export async function redirectToCheckout({
  planId,
  session,
  couponId,
}: {
  planId: string;
  session: Session | null;
  couponId?: string;
}) {
  if (!session?.user) {
    throw new Error('You must be logged in to subscribe');
  }

  try {
    // Create a checkout session via the server-side API
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        userId: session.user.id,
        email: session.user.email,
        couponId,
        // Define success and cancel URLs
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing?checkout=canceled`,
      }),
    });

    const { sessionId, url } = await response.json();

    // If we have a direct URL, redirect to it
    if (url) {
      window.location.href = url;
      return;
    }

    // Otherwise use the Stripe.js client to redirect
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Failed to load Stripe.js');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      throw new Error(error.message || 'Something went wrong with the checkout');
    }
  } catch (error: any) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}

/**
 * Redirects the user to the Stripe customer portal to manage their subscription
 */
export async function redirectToCustomerPortal() {
  try {
    const response = await fetch('/api/stripe/customer-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { url } = await response.json();
    window.location.href = url;
  } catch (error: any) {
    console.error('Error redirecting to customer portal:', error);
    throw error;
  }
}
