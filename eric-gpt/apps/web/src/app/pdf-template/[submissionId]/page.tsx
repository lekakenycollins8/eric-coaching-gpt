import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

// Define the type for our submission data
interface Submission {
  _id: string;
  worksheetId: string;
  worksheetTitle: string;
  answers: Record<string, any>;
  aiFeedback: string;
  createdAt: string;
}

// This page is a server component that will be used to generate PDFs
export default async function PdfTemplatePage({
  params,
}: {
  params: { submissionId?: string };
}) {
  // Access params using proper pattern for Next.js 14+
  const { submissionId } = params;
  
  // Fetch the submission data from the API
  const submission = await getSubmission(submissionId);
  
  if (!submission) {
    notFound();
  }
  
  return (
    <div className="pdf-container bg-white p-8 max-w-4xl mx-auto">
      {/* Header with logo */}
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="flex items-center">
          <div className="relative w-12 h-12 mr-4">
            <Image
              src="/logo.svg"
              alt="Eric GPT Coaching"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-primary">Eric GPT Coaching</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDate(submission.createdAt)}
        </div>
      </header>
      
      {/* Worksheet title */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{submission.worksheetTitle}</h2>
        <p className="text-muted-foreground">Worksheet Submission & Feedback</p>
      </div>
      
      {/* User's answers */}
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-4 bg-muted p-2">Your Responses</h3>
        <div className="space-y-4">
          {Object.entries(submission.answers).map(([key, value]) => (
            <div key={key} className="border-b pb-2">
              <p className="font-medium">{key}</p>
              <p className="text-muted-foreground">{formatAnswerValue(value)}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* AI Feedback */}
      <section>
        <h3 className="text-lg font-medium mb-4 bg-primary text-primary-foreground p-2">
          Eric's Coaching Feedback
        </h3>
        <div className="prose max-w-none">
          {submission.aiFeedback.split('\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="mt-12 pt-4 border-t text-sm text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} Eric GPT Coaching Platform</p>
        <p>This document was generated on {formatDate(new Date().toISOString())}</p>
      </footer>
    </div>
  );
}

// Helper function to format answer values for display
function formatAnswerValue(value: any): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  } else if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  } else if (value === null || value === undefined) {
    return 'Not provided';
  } else {
    return String(value);
  }
}

// Function to fetch submission data from the API
async function getSubmission(submissionId: string): Promise<Submission | null> {
  try {
    // Using server-side fetch with absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/submissions/${submissionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache this request
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch submission: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.submission;
  } catch (error) {
    console.error('Error fetching submission:', error);
    return null;
  }
}
