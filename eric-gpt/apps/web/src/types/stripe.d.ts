import 'stripe';

declare module 'stripe' {
  namespace Stripe {
    interface StripeConfig {
      apiVersion?: '2025-04-30.basil' | '2025-05-28.basil';
    }
  }
}
