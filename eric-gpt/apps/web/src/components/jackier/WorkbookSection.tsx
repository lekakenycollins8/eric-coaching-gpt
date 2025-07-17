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
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
        {section.description && (
          <CardDescription>{section.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstSection}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous Section
        </Button>
        
        {!isLastSection ? (
          <Button
            type="button"
            onClick={onNext}
          >
            Next Section
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting || hasErrors}
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
