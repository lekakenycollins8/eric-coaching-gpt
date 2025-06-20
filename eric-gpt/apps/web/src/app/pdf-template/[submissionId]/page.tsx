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
  searchParams,
}: {
  params: Promise<{ submissionId?: string }>;
  searchParams: Promise<{ userId?: string }>;
}) {
  // Access params using proper pattern for Next.js 14+
  const { submissionId } = await params;
  
  // Check if submissionId exists before proceeding
  if (!submissionId) {
    notFound();
  }
  
  // Get the userId from searchParams - must await in Next.js 14+
  const { userId } = await searchParams;
  
  // Fetch the submission data from the API
  const submission = await getSubmission(submissionId, userId);
  
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
          {formatAIFeedback(submission.aiFeedback)}
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

// Helper function to format AI feedback with proper structure
function formatAIFeedback(feedback: string): React.ReactNode {
  if (!feedback) return <p>No feedback provided.</p>;
  
  // Split by double newlines to identify paragraphs
  const paragraphs = feedback.split(/\n\n+/);
  
  return (
    <>
      {paragraphs.map((paragraph, idx) => {
        // Check if paragraph starts with a bullet point or number
        const isList = /^\s*[•\-*]|^\s*\d+\./.test(paragraph);
        
        if (isList) {
          // Handle bullet points by splitting into lines
          const listItems = paragraph.split(/\n/);
          return (
            <ul key={idx} className="list-disc pl-5 mb-4">
              {listItems.map((item, itemIdx) => {
                // Clean up bullet points or numbers
                const cleanItem = item.replace(/^\s*[•\-*]\s*|^\s*\d+\.\s*/, '');
                return cleanItem.trim() ? <li key={itemIdx} className="mb-1">{cleanItem}</li> : null;
              })}
            </ul>
          );
        } else {
          // Handle regular paragraphs, preserving internal line breaks
          const lines = paragraph.split(/\n/);
          return (
            <div key={idx} className="mb-4">
              {lines.map((line, lineIdx) => (
                <React.Fragment key={lineIdx}>
                  {line}
                  {lineIdx < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          );
        }
      })}
    </>
  );
}

// Function to fetch submission data from the API
async function getSubmission(submissionId: string, userId?: string): Promise<Submission | null> {
  try {
    // Using server-side fetch with absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // Ensure we're using the correct parameter name (submissionId) that matches the server endpoint
    // Include userId as a query parameter if provided
    const url = userId 
      ? `${baseUrl}/api/submissions/${submissionId}?userId=${userId}` 
      : `${baseUrl}/api/submissions/${submissionId}`;
    
    const response = await fetch(url, {
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
