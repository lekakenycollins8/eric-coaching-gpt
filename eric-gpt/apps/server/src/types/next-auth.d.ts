import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    stripeCustomerId?: string;
    subscription?: {
      planId: string;
      priceId?: string;
      status: 'active' | 'past_due' | 'canceled';
      currentPeriodStart: number;
      currentPeriodEnd: number;
      submissionsThisPeriod: number;
    };
    usage?: {
      totalSubmissions: number;
      totalTokensUsed: number;
    };
  }
}

declare module 'next-auth/jwt' {
  /** Extend the built-in JWT types */
  interface JWT {
    id?: string;
  }
}
