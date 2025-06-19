'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

interface Submission {
  _id: string;
  worksheetId: string;
  worksheetTitle: string;
  answers: Record<string, any>;
  aiFeedback: string;
  createdAt: string;
  userId: string;
}

export function useSubmission(submissionId: string) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!session?.user?.id || !submissionId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/submissions/${submissionId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch submission');
        }

        const data = await response.json();
        setSubmission(data.submission);
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError('Failed to load submission. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load submission details.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [session, submissionId, toast]);

  const downloadPdf = async () => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `worksheet-submission-${submissionId}.pdf`;
      
      // Append to the document and trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'PDF Downloaded',
        description: 'Your worksheet submission has been downloaded as a PDF.',
      });
      
      return true;
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast({
        title: 'Error',
        description: 'Failed to download PDF. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    submission,
    isLoading,
    error,
    downloadPdf
  };
}
