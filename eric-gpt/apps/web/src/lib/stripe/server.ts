/**
 * Stripe server-side utilities for the Eric GPT Coaching Platform
 */
import Stripe from 'stripe';

// Initialize the Stripe client with the secret key
let stripe: Stripe | null = null;

export const getStripeInstance = (): Stripe => {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('Stripe secret key is missing');
    }
    stripe = new Stripe(key, {
      apiVersion: '2025-04-30.basil', // Use the latest stable API version
    });
  }
  return stripe;
};
