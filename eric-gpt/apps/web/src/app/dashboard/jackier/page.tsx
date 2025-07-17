'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { hasFeatureAccess } from '@/lib/subscription-utils';
import { useJackierWorkbook } from '@/hooks/useJackierWorkbook';

export default function JackierWorkbookPage() {
  const router = useRouter();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { workbook, isLoading, error, userSubmission } = useJackierWorkbook();
  
  // Check if user has access to the Jackier Workbook feature
  const hasAccess = hasFeatureAccess(subscription, 'worksheetSubmit', { 
    isLoading: subscriptionLoading 
  });

  // Handle starting the workbook
  const handleStartWorkbook = () => {
    router.push('/dashboard/jackier/workbook');
  };

  // Handle continuing the workbook
  const handleContinueWorkbook = () => {
    router.push('/dashboard/jackier/workbook');
  };

  // Handle viewing diagnosis
  const handleViewDiagnosis = () => {
    router.push('/dashboard/jackier/diagnosis');
  };

  // Handle starting follow-up worksheet
  const handleStartFollowup = (worksheetId: string) => {
    router.push(`/dashboard/jackier/followup/${worksheetId}`);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Jackier Method Workbook</h1>
          <p className="text-muted-foreground">
            Complete the Jackier Method Workbook to receive personalized leadership diagnosis and follow-up recommendations.
          </p>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Subscription Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>You need an active subscription to access the Jackier Method Workbook.</p>
            <div>
              <Button asChild variant="default">
                <Link href="/dashboard/subscription">Subscribe Now</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Jackier Method Workbook</h1>
        <p className="text-muted-foreground">
          Complete the Jackier Method Workbook to receive personalized leadership diagnosis and follow-up recommendations.
        </p>
      </div>

      {!userSubmission && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Leadership Assessment</CardTitle>
            <CardDescription>
              Start your leadership journey with the Jackier Method assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This comprehensive assessment will help identify your leadership strengths and areas for growth.
              After completion, you'll receive a personalized diagnosis and recommended follow-up worksheets.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleStartWorkbook} className="w-full">
              Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {userSubmission && !userSubmission.status && (
        <Card className="mb-6 border-amber-500">
          <CardHeader>
            <CardTitle>Continue Your Assessment</CardTitle>
            <CardDescription>
              You have a draft assessment in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You've started the Jackier Method assessment but haven't completed it yet.
              Continue where you left off to receive your personalized leadership diagnosis.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleContinueWorkbook} className="w-full">
              Continue Assessment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {userSubmission && userSubmission.status === 'submitted' && userSubmission.diagnosis && (
        <>
          <Card className="mb-6 border-green-500">
            <CardHeader className="bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <CardTitle>Assessment Complete</CardTitle>
              </div>
              <CardDescription>
                Your leadership diagnosis is ready
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Based on your assessment, we've prepared a personalized leadership diagnosis
                highlighting your strengths, challenges, and specific recommendations.
              </p>
              
              {userSubmission?.diagnosis?.summary && (
                <div className="mb-4">
                  <h3 className="font-medium mb-1">Summary</h3>
                  <p className="text-sm">{userSubmission?.diagnosis?.summary}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleViewDiagnosis} className="w-full">
                View Full Diagnosis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          {userSubmission?.diagnosis?.followupWorksheets && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Recommended Follow-up Worksheets</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userSubmission?.diagnosis?.followupWorksheets?.pillars && 
                 userSubmission?.diagnosis?.followupWorksheets?.pillars.map((pillarId) => (
                  <Card key={pillarId} className="border-blue-400">
                    <CardHeader>
                      <CardTitle>Pillar Worksheet</CardTitle>
                      <CardDescription>
                        {pillarId.replace(/pillar(\d+)_/i, 'Pillar #$1: ').replace(/_/g, ' ')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        This worksheet will help you develop specific leadership skills related to this pillar.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handleStartFollowup(pillarId)} 
                        variant="outline" 
                        className="w-full"
                      >
                        Start Worksheet
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
                {userSubmission?.diagnosis?.followupWorksheets?.followup && (
                  <Card className="border-purple-400">
                    <CardHeader>
                      <CardTitle>Follow-up Worksheet</CardTitle>
                      <CardDescription>
                        {userSubmission?.diagnosis?.followupWorksheets?.followup.replace(/_/g, ' ')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        This follow-up worksheet will help you integrate insights from your diagnosis.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handleStartFollowup(userSubmission?.diagnosis?.followupWorksheets?.followup || '')} 
                        variant="outline" 
                        className="w-full"
                      >
                        Start Worksheet
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
