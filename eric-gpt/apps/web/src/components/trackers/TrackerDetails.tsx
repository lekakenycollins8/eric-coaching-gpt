import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTracker } from '@/hooks/useTrackers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { CalendarDays, MoreVertical, FileText, Trash, CheckCircle, XCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import TrackerEntryForm from './TrackerEntryForm';
import TrackerReflectionForm from './TrackerReflectionForm';

interface TrackerDetailsProps {
  trackerId: string;
}

type TrackerStatus = 'active' | 'completed' | 'abandoned';

export default function TrackerDetails({ trackerId }: TrackerDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { trackerData, isLoading, updateTracker, deleteTracker, downloadPdf } = useTracker(trackerId);
  
  // Extract data from trackerData
  const tracker = trackerData?.tracker;
  const entries = trackerData?.entries || [];
  const reflection = trackerData?.reflection || null;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Get status badge color
  const getStatusColor = (status: TrackerStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'abandoned':
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };
  
  // Handle tracker deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTracker();
      toast({
        title: 'Tracker deleted',
        description: 'Your tracker has been deleted successfully.',
        variant: 'default',
      });
      router.push('/dashboard/trackers');
    } catch (error) {
      console.error('Error deleting tracker:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tracker. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle status update
  const handleStatusUpdate = async (newStatus: TrackerStatus) => {
    if (!tracker) return;
    
    try {
      setIsUpdatingStatus(true);
      await updateTracker({
        status: newStatus,
      });
      toast({
        title: 'Status updated',
        description: `Tracker status updated to ${newStatus}.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating tracker status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tracker status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!tracker) return;
    
    try {
      await downloadPdf();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to download PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  if (isLoading || !tracker) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        
        {[1, 2, 3, 4, 5].map((day) => (
          <Card key={day}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!tracker) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">Tracker not found</h3>
        <p className="text-muted-foreground mt-2">
          The tracker you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link href="/trackers" className="mt-4 inline-block">
          <Button>Back to Trackers</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{tracker.title}</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1 px-3">
                <MoreVertical className="h-4 w-4" />
                <span>Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {tracker.status !== 'completed' && (
                <DropdownMenuItem 
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={isUpdatingStatus}
                  className="flex items-center"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Completed
                </DropdownMenuItem>
              )}
              
              {tracker.status !== 'abandoned' && (
                <DropdownMenuItem 
                  onClick={() => handleStatusUpdate('abandoned')}
                  disabled={isUpdatingStatus}
                  className="flex items-center"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark as Abandoned
                </DropdownMenuItem>
              )}
              
              {tracker.status !== 'active' && (
                <DropdownMenuItem 
                  onClick={() => handleStatusUpdate('active')}
                  disabled={isUpdatingStatus}
                  className="flex items-center"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reactivate Tracker
                </DropdownMenuItem>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="flex items-center text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Tracker
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this tracker and all of its entries and reflections.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Overview</CardTitle>
              <CardDescription>Track your progress over 5 days</CardDescription>
            </div>
            <Badge className={cn(getStatusColor(tracker.status as TrackerStatus))}>
              {tracker.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">{tracker.description}</p>
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarDays className="mr-1 h-3 w-3" />
            <span>
              Started {tracker.startDate ? format(new Date(tracker.startDate), 'MMM d, yyyy') : 'N/A'}
            </span>
          </div>
          {tracker.submissionId && (
            <div className="flex items-center mt-2 text-xs">
              <FileText className="mr-1 h-3 w-3" />
              <Link href={`/dashboard/submissions/${tracker.submissionId}`} className="text-primary hover:underline">
                View related worksheet submission
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Daily Entries</h3>
        
        {[1, 2, 3, 4, 5].map((day) => {
          const entry = entries?.find(e => e.day === day);
          return (
            <TrackerEntryForm
              key={day}
              trackerId={trackerId}
              day={day}
              initialCompleted={entry?.completed || false}
              initialNotes={entry?.notes || ''}
            />
          );
        })}
      </div>
      
      <div className="space-y-6 pt-4">
        <h3 className="text-xl font-semibold">Reflection</h3>
        <TrackerReflectionForm
          trackerId={trackerId}
          initialContent={reflection?.content || ''}
        />
      </div>
    </div>
  );
}
