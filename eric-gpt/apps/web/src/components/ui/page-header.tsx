'use client';

import React from 'react';

interface PageHeaderProps {
  heading: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * A reusable page header component with heading and optional description
 */
export function PageHeader({ heading, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}
