'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import AuthProvider from '../components/auth/AuthProvider';
import type { Session } from "next-auth";

interface ProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <AuthProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
