'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCcw, LineChart } from 'lucide-react';
import { use } from 'react';
import { useFollowupType } from '@/hooks/useFollowupType';
import { useFollowupDiagnosis } from '@/hooks/useFollowupDiagnosis';
import type { FollowupDiagnosis } from '@/hooks/useFollowupDiagnosis';
import Link from 'next/link';

interface DiagnosisPageProps {
  params: Promise<{ id: string }>;
}

export default function DiagnosisPage({ params }: DiagnosisPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  
  // Get the follow-up type (pillar or workbook)
  const followupType = useFollowupType(id);
  
  // Fetch the diagnosis data for this follow-up
  const { data: diagnosis, isLoading, error, refetch, isError } = useFollowupDiagnosis(id);
  
  useEffect(() => {
    // Set loading state based on data fetching
    setLoading(isLoading);
    
    // Log diagnosis data for debugging
    if (diagnosis) {
      console.log(`${followupType} diagnosis loaded for ID ${id}:`, diagnosis);
    }
  }, [isLoading, diagnosis, followupType, id]);
  
  // Handle retry
  const handleRetry = async () => {
    setLoading(true);
    try {
      await refetch();
    } catch (err) {
      console.error(`Error retrying ${followupType} diagnosis fetch:`, err);
    }
  };
  
  // Handle loading state
  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <PageHeader
          heading={`${followupType === 'pillar' ? 'Pillar' : 'Workbook'} Follow-up Diagnosis`}
          description="Loading your progress analysis..."
        />
        <div className="mt-8 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (isError || !diagnosis) {
    return (
      <div className="container py-6">
        <PageHeader
          heading={`${followupType === 'pillar' ? 'Pillar' : 'Workbook'} Follow-up Diagnosis`}
          description="Review your progress and insights"
        />
        <div className="mt-8 max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Diagnosis</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : `Failed to load ${followupType} follow-up diagnosis. Please try again later.`}
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 flex justify-center">
            <Button onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" /> Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <PageHeader
        heading={`${followupType === 'pillar' ? 'Pillar' : 'Workbook'} Follow-up Diagnosis`}
        description="Review your progress and insights"
      />
      
      <div className="mt-8 max-w-3xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle>{diagnosis?.title || `${followupType === 'pillar' ? 'Pillar' : 'Workbook'} Follow-up Diagnosis`}</CardTitle>
            </div>
            <CardDescription>
              Completed on {diagnosis?.completedAt ? new Date(diagnosis.completedAt).toLocaleDateString() : 'recently'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {diagnosis?.diagnosis ? (
              <>
                <h3 className="font-medium text-lg">Analysis:</h3>
                <div className="p-4 bg-white rounded-md border">
                  <p className="whitespace-pre-wrap">{diagnosis.diagnosis}</p>
                </div>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Diagnosis Available</AlertTitle>
                <AlertDescription>
                  The diagnosis for this follow-up is not available yet.
                </AlertDescription>
              </Alert>
            )}
            
            {diagnosis?.recommendations && diagnosis.recommendations.length > 0 ? (
              <>
                <h3 className="font-medium text-lg mt-6">Recommendations:</h3>
                <div className="p-4 bg-white rounded-md border">
                  <ul className="list-disc pl-5 space-y-2">
                    {diagnosis.recommendations.map((recommendation: string, index: number) => (
                      <li key={index} className="text-gray-800">{recommendation}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : diagnosis?.diagnosis ? (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle>No Specific Recommendations</AlertTitle>
                <AlertDescription>
                  No specific recommendations were generated for this follow-up. Please refer to the overall analysis above.
                </AlertDescription>
              </Alert>
            ) : null}
            
            {diagnosis?.progressData && Object.keys(diagnosis.progressData).length > 0 ? (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <LineChart className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-lg">Progress Overview:</h3>
                </div>
                <div className="p-4 bg-white rounded-md border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(diagnosis.progressData).map(([key, value]: [string, string | number]) => (
                      <div key={key} className="border rounded p-3 bg-blue-50 border-blue-200">
                        <h4 className="font-medium text-blue-800">{key}</h4>
                        <p className="text-sm text-gray-700">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : diagnosis?.diagnosis ? (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle>No Progress Data Available</AlertTitle>
                <AlertDescription>
                  Detailed progress metrics are not available for this follow-up assessment.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            
            <Link href="/dashboard/followup">
              <Button>
                Return to Dashboard
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
