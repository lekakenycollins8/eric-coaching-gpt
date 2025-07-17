import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description: string;
  backLink?: string;
  backLinkText?: string;
  actionButton?: React.ReactNode;
}

export function ErrorState({ 
  title = 'Error', 
  description, 
  backLink,
  backLinkText = 'Back',
  actionButton
}: ErrorStateProps) {
  return (
    <div className="container mx-auto py-8">
      {backLink && (
        <div className="mb-4">
          <Link href={backLink}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLinkText}
            </Button>
          </Link>
        </div>
      )}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {description}
          {actionButton && (
            <div className="mt-4">
              {actionButton}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
