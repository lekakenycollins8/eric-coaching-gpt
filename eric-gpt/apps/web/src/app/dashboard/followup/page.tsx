'use client';

import { PageHeader } from '../../../components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FollowupRecommendations } from '@/components/followup/FollowupRecommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFollowupWorksheets } from '@/hooks/useFollowupWorksheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function FollowupDashboardPage() {
  // Fetch all follow-up worksheets
  const { 
    data: worksheets,
    isLoading,
    error
  } = useFollowupWorksheets();

  return (
    <div className="container py-6">
      <PageHeader
        heading="Follow-up System"
        description="Track your progress and complete follow-up worksheets"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Recommendations Section - Takes 2/3 of the space on larger screens */}
        <div className="md:col-span-2">
          <FollowupRecommendations />
        </div>

        {/* Available Worksheets Section - Takes 1/3 of the space */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Available Worksheets</CardTitle>
              <CardDescription>
                Browse all available follow-up worksheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load worksheets. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : !worksheets || !worksheets.worksheets || worksheets.worksheets.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Worksheets</AlertTitle>
                  <AlertDescription>
                    No follow-up worksheets are available at this time.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {worksheets.worksheets.map((worksheet: any) => (
                    <Card key={worksheet.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{worksheet.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {worksheet.description}
                            </p>
                          </div>
                          <Link href={`/dashboard/followup/${worksheet.id}`}>
                            <Button size="sm" variant="outline">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration with Coaching */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Need Additional Help?</CardTitle>
              <CardDescription>
                Schedule a coaching session for personalized guidance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/coaching/schedule">
                <Button className="w-full">
                  Schedule Coaching Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
