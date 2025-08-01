'use client';

import { PageHeader } from '../../../components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useFollowupWorksheets } from '@/hooks/useFollowupWorksheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowRight, ClipboardList, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function FollowupDashboardPage() {
  // Fetch all follow-up worksheets
  const { 
    data: worksheets,
    isLoading,
    error
  } = useFollowupWorksheets();

  // Separate worksheets by type for better organization
  const pillarWorksheets = worksheets?.worksheets?.filter(w => w.id.includes('pillar')) || [];
  const workbookWorksheets = worksheets?.worksheets?.filter(w => !w.id.includes('pillar')) || [];

  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <PageHeader
        heading="Follow-up System"
        description="Track your progress and complete follow-up worksheets"
      />

      <div className="grid grid-cols-1 gap-8 mt-8">
        {/* Available Worksheets Section */}
        <Card className="border-primary/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
              <div>
                <CardTitle className="text-2xl font-bold text-primary">Available Worksheets</CardTitle>
                <CardDescription className="text-base mt-1">
                  Browse all available follow-up worksheets to track your progress
                </CardDescription>
              </div>
              <ClipboardList className="h-8 w-8 text-primary" />
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex flex-col space-y-3">
                        <div className="flex justify-between">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-full mt-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="text-base">Error</AlertTitle>
                  <AlertDescription>
                    Failed to load worksheets. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : !worksheets || !worksheets.worksheets || worksheets.worksheets.length === 0 ? (
                <Alert className="mb-6">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="text-base">No Worksheets</AlertTitle>
                  <AlertDescription>
                    No follow-up worksheets are available at this time.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-8">
                  {/* Pillar Worksheets Section */}
                  {pillarWorksheets.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Badge variant="outline" className="mr-2 py-1 px-3 text-xs">
                          Pillar
                        </Badge>
                        Pillar Follow-ups
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pillarWorksheets.map((worksheet) => (
                          <WorksheetCard key={worksheet.id} worksheet={worksheet} type="pillar" />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Workbook Worksheets Section */}
                  {workbookWorksheets.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Badge className="mr-2 py-1 px-3 text-xs">
                          Workbook
                        </Badge>
                        Workbook Follow-ups
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workbookWorksheets.map((worksheet) => (
                          <WorksheetCard key={worksheet.id} worksheet={worksheet} type="workbook" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
        </Card>

        {/* Integration with Coaching */}
        <Card className="bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-50 border-blue-200 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <div className="w-full h-full rounded-full bg-blue-400 transform translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <CardHeader>
              <CardTitle className="text-blue-800 text-xl">Need Additional Help?</CardTitle>
              <CardDescription className="text-blue-700 text-base">
                Schedule a coaching session for personalized guidance with an expert
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-blue-700 mb-4">
                Get personalized feedback and strategies to implement your leadership skills more effectively.
              </p>
              <Link href="/dashboard/coaching/schedule">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Schedule Coaching Session
                </Button>
              </Link>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Worksheet card component for better organization and consistent styling
function WorksheetCard({ worksheet, type }: { worksheet: any, type: 'pillar' | 'workbook' }) {
  const isPillar = type === 'pillar';
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-md border-l-4",
      isPillar ? "border-l-indigo-400" : "border-l-primary"
    )}>
      <CardHeader className="p-5 pb-0">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {worksheet.title}
          </CardTitle>
          <Badge 
            variant={isPillar ? "outline" : "default"}
            className={cn(
              "whitespace-nowrap text-xs",
              isPillar ? "border-indigo-400 text-indigo-700" : ""
            )}
          >
            {isPillar ? 'Pillar' : 'Workbook'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-3">
        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem]">
          {worksheet.description}
        </p>
        
        <div className="flex items-center text-xs text-muted-foreground mt-3">
          <Clock className="h-3.5 w-3.5 mr-1" />
          <span>Est. 15-20 min</span>
          
          <span className="mx-2">•</span>
          
          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-500" />
          <span>Tracks progress</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-5 pt-0">
        <Link href={`/dashboard/followup/${worksheet.id}`} className="w-full">
          <Button 
            className={cn(
              "w-full transition-all",
              isPillar ? "bg-indigo-600 hover:bg-indigo-700" : ""
            )}
          >
            Start Worksheet <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
