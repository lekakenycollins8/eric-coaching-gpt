'use client';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import React from 'react';

// This layout disables React Strict Mode for the Swagger UI components
// to prevent warnings about deprecated lifecycle methods
export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
