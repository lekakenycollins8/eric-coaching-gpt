import { useState } from 'react';
import Link from 'next/link';
import { useTrackers } from '@/hooks/useTrackers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { CalendarDays, ChevronRight, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrackerStatus = 'active' | 'completed' | 'abandoned';

export default function TrackerList() {
  const [activeTab, setActiveTab] = useState<TrackerStatus>('active');
  const { trackers, isLoading } = useTrackers(activeTab);
  
  // Filter trackers by status
  const filteredTrackers = trackers?.filter(tracker => tracker.status === activeTab) || [];
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">My Trackers</h2>
        <Link href="/dashboard/trackers/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Tracker
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="active" className="w-full" onValueChange={(value) => setActiveTab(value as TrackerStatus)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="abandoned">Abandoned</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          {renderTrackerList('active')}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {renderTrackerList('completed')}
        </TabsContent>
        
        <TabsContent value="abandoned" className="mt-6">
          {renderTrackerList('abandoned')}
        </TabsContent>
      </Tabs>
    </div>
  );
  
  function renderTrackerList(status: TrackerStatus) {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (filteredTrackers.length === 0) {
      return (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">No {status} trackers found</h3>
          {status === 'active' && (
            <p className="text-muted-foreground mt-2">
              Start tracking your progress by creating a new tracker.
            </p>
          )}
          {status === 'completed' && (
            <p className="text-muted-foreground mt-2">
              Complete your active trackers to see them here.
            </p>
          )}
          {status === 'abandoned' && (
            <p className="text-muted-foreground mt-2">
              Trackers you decide to abandon will appear here.
            </p>
          )}
          {status === 'active' && (
            <Link href="/dashboard/trackers/create" className="mt-4 inline-block">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Tracker
              </Button>
            </Link>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTrackers.map((tracker) => (
          <Link href={`/dashboard/trackers/${tracker._id}`} key={tracker._id}>
            <Card className="overflow-hidden h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{tracker.title}</CardTitle>
                  <Badge className={cn("ml-2", getStatusColor(tracker.status as TrackerStatus))}>
                    {tracker.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {tracker.description}
                </p>
                <div className="flex items-center mt-4 text-xs text-muted-foreground">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  <span>
                    Started {tracker.startDate ? format(new Date(tracker.startDate), 'MMM d, yyyy') : 'N/A'}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full justify-between" asChild>
                  <div>
                    <span>View Details</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    );
  }
}
