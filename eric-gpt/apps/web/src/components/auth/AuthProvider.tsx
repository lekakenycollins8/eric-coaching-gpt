'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import type { Session } from "next-auth";

interface AuthProviderProps {
  children: ReactNode;
  session?: Session | null;
}

/**
 * Authentication provider component that wraps the application
 * and provides authentication context using NextAuth.js
 */
export default function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
