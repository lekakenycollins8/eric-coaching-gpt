'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Download, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTrackers } from '@/hooks/useTrackers';

interface FeedbackPanelProps {
  feedback: string | null;
  isLoading: boolean;
  error: string | null;
  remainingQuota: number | null;
  submissionId?: string | null;
  worksheetTitle?: string;
}

/**
 * Component to display AI coaching feedback for worksheet submissions
 */
const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedback,
  isLoading,
  error,
  remainingQuota,
  submissionId,
  worksheetTitle
}) => {
  const { toast } = useToast();
  const { createTracker } = useTrackers();
  const [isPdfLoading, setIsPdfLoading] = React.useState(false);
  const [isTrackerDialogOpen, setIsTrackerDialogOpen] = React.useState(false);
  const [isCreatingTracker, setIsCreatingTracker] = React.useState(false);
  const [trackerTitle, setTrackerTitle] = React.useState('');
  const [trackerDescription, setTrackerDescription] = React.useState('');

  const handleDownloadPdf = async () => {
    if (!submissionId) {
      toast({
        title: "Error",
        description: "Cannot download PDF: submission ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPdfLoading(true);
      
      // Create a URL to the PDF endpoint
      const pdfUrl = `/api/submissions/${submissionId}/pdf`;
      
      // Create a link element and trigger a download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.setAttribute('download', `worksheet-feedback-${submissionId}.pdf`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "PDF Generated",
        description: "Your worksheet feedback PDF is downloading",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Error",
        description: "Failed to generate PDF. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsPdfLoading(false);
    }
  };
  
  const handleCreateTracker = async () => {
    if (!submissionId) {
      toast({
        title: "Error",
        description: "Cannot create tracker: submission ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    if (!trackerTitle.trim() || !trackerDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and description for your tracker",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreatingTracker(true);
      
      // Calculate start date (today)
      const startDate = new Date();
      
      // Use the createTracker hook function
      await createTracker({
        title: trackerTitle,
        description: trackerDescription,
        startDate: startDate.toISOString(),
        submissionId: submissionId,
      });
      
      toast({
        title: "Tracker Created",
        description: "Your 5-day commitment tracker has been created. Track your progress in the Trackers section.",
      });
      
      // Close the dialog and reset form
      setIsTrackerDialogOpen(false);
      setTrackerTitle('');
      setTrackerDescription('');
    } catch (error) {
      console.error('Error creating tracker:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tracker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTracker(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Eric's Coaching Feedback</CardTitle>
          <CardDescription>
            Based on your responses, here's your personalized coaching feedback
            {remainingQuota !== null && (
              <span className="block text-sm mt-1">
                You have {remainingQuota} {remainingQuota === 1 ? 'submission' : 'submissions'} remaining this month
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate max-w-none">
            {formatAIFeedback(feedback)}
          </div>
        </CardContent>
        {submissionId && (
          <CardFooter className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTrackerDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <ClipboardList className="h-4 w-4 mr-1" />
              Create Tracker
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isPdfLoading}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4 mr-1" />
              {isPdfLoading ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Tracker Creation Dialog */}
      <Dialog open={isTrackerDialogOpen} onOpenChange={setIsTrackerDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create 5-Day Commitment Tracker</DialogTitle>
            <DialogDescription>
              Create a tracker to follow through on commitments from your {worksheetTitle || 'worksheet'} feedback.
              You'll track your progress for the next 5 days.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tracker-title" className="col-span-4">
                What will you commit to doing?
              </Label>
              <Input
                id="tracker-title"
                value={trackerTitle}
                onChange={(e) => setTrackerTitle(e.target.value)}
                placeholder="e.g., Practice active listening daily"
                className="col-span-4"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tracker-description" className="col-span-4">
                Why is this important to you?
              </Label>
              <Textarea
                id="tracker-description"
                value={trackerDescription}
                onChange={(e) => setTrackerDescription(e.target.value)}
                placeholder="Describe why this commitment matters and what success looks like"
                className="col-span-4"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTrackerDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTracker}
              disabled={isCreatingTracker}
            >
              {isCreatingTracker ? 'Creating...' : 'Create Tracker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

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

export default FeedbackPanel;
