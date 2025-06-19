'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSubmission } from '@/hooks/useSubmission';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;
  const { submission, isLoading, error, downloadPdf } = useSubmission(submissionId);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await downloadPdf();
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="py-10">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Loading Submission...</h1>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Submission Error</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
        <div className="mt-4">
          <Link href="/dashboard/submissions" className="text-primary hover:underline">
            Return to submissions list
          </Link>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="py-10">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Submission Not Found</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-700">
          The requested submission could not be found. It may have been deleted or you may not have permission to view it.
        </div>
        <div className="mt-4">
          <Link href="/dashboard/submissions" className="text-primary hover:underline">
            Return to submissions list
          </Link>
        </div>
      </div>
    );
  }

  // Group answers by section for better display
  const sections: Record<string, Record<string, any>> = {};
  Object.entries(submission.answers).forEach(([key, value]) => {
    const sectionMatch = key.match(/^([^.]+)\./);
    const section = sectionMatch ? sectionMatch[1] : 'general';
    const fieldName = sectionMatch ? key.substring(section.length + 1) : key;
    
    if (!sections[section]) {
      sections[section] = {};
    }
    
    sections[section][fieldName] = value;
  });

  return (
    <div className="py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">{submission.worksheetTitle}</h1>
        </div>
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            )}
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Submitted on {formatDate(submission.createdAt)}
        </div>
        <Badge variant="outline" className="text-xs">
          Worksheet ID: {submission.worksheetId}
        </Badge>
      </div>

      <div className="space-y-8">
        {/* Answers Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(sections).map(([section, fields]) => (
                <div key={section} className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 capitalize">{section}</h3>
                  <div className="space-y-4 pl-4">
                    {Object.entries(fields).map(([field, value]) => (
                      <div key={field} className="space-y-1">
                        <h4 className="text-sm font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          {typeof value === 'string' ? (
                            value.split('\n').map((line, i) => (
                              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                {line || '\u00A0'}
                              </p>
                            ))
                          ) : Array.isArray(value) ? (
                            <ul className="list-disc pl-5">
                              {value.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            String(value)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Feedback Section */}
        <Card>
          <CardHeader>
            <CardTitle>AI Coaching Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-green max-w-none">
              {submission.aiFeedback.split('\n\n').map((paragraph, i) => (
                <p key={i} className={i > 0 ? 'mt-4' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
