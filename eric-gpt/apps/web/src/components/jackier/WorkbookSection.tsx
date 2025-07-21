import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { WorkbookQuestion } from './WorkbookQuestion';

interface WorkbookSectionProps {
  section: {
    title: string;
    description?: string;
    questions: any[];
  };
  children?: React.ReactNode;
  isFirstSection?: boolean;
  isLastSection?: boolean;
  isSubmitting: boolean;
  hasErrors?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
}

export function WorkbookSection({
  section,
  children,
  isFirstSection,
  isLastSection,
  isSubmitting,
  hasErrors,
  onPrevious,
  onNext,
  onSubmit
}: WorkbookSectionProps) {
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{section.title}</CardTitle>
        {section.description && (
          <CardDescription className="mt-2">{section.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {children}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstSection}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous Section
        </Button>
        
        {!isLastSection ? (
          <Button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            Next Section
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting || hasErrors}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Workbook
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
