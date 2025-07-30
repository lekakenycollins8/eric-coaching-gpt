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

// Helper component to safely render potentially complex objects
const SafeRender = ({ value }: { value: any }) => {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string') {
    return <p className="whitespace-pre-wrap">{value}</p>;
  }
  
  if (typeof value === 'object') {
    try {
      // Handle specific object structures we know about
      if ('fullText' in value) {
        return <p className="whitespace-pre-wrap">{value.fullText}</p>;
      }
      
      if ('action' in value) {
        // If only action has content and other fields are empty or undefined, just show the action
        const hasOnlyAction = value.action && 
          (!value.implementation || value.implementation === '') && 
          (!value.outcome || value.outcome === '') && 
          (!value.measurement || value.measurement === '');
          
        if (hasOnlyAction) {
          return <p className="whitespace-pre-wrap">{value.action}</p>;
        }
        
        return (
          <div className="space-y-1">
            {value.action && <p><strong>Action:</strong> {value.action}</p>}
            {value.implementation && <p><strong>Implementation:</strong> {value.implementation}</p>}
            {value.outcome && <p><strong>Outcome:</strong> {value.outcome}</p>}
            {value.measurement && <p><strong>Measurement:</strong> {value.measurement}</p>}
          </div>
        );
      }
      
      if ('strength' in value) {
        return (
          <div className="space-y-1">
            {value.strength && <p><strong>Strength:</strong> {value.strength}</p>}
            {value.evidence && <p><strong>Evidence:</strong> {value.evidence}</p>}
            {value.impact && <p><strong>Impact:</strong> {value.impact}</p>}
            {value.leverage && <p><strong>Leverage:</strong> {value.leverage}</p>}
          </div>
        );
      }
      
      if ('area' in value) {
        return (
          <div className="space-y-1">
            {value.area && <p><strong>Area:</strong> {value.area}</p>}
            {value.evidence && <p><strong>Evidence:</strong> {value.evidence}</p>}
            {value.impact && <p><strong>Impact:</strong> {value.impact}</p>}
            {value.rootCause && <p><strong>Root Cause:</strong> {value.rootCause}</p>}
          </div>
        );
      }
      
      if ('reason' in value) {
        return (
          <div className="space-y-1">
            {value.title && <p><strong>Title:</strong> {value.title}</p>}
            {value.reason && <p><strong>Reason:</strong> {value.reason}</p>}
            {value.impact && <p><strong>Impact:</strong> {value.impact}</p>}
            {value.exercise && <p><strong>Exercise:</strong> {value.exercise}</p>}
            {value.connection && <p><strong>Connection:</strong> {value.connection}</p>}
            {value.focus && <p><strong>Focus:</strong> {value.focus}</p>}
          </div>
        );
      }
      
      // Fallback for unknown object structures
      return <p className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</p>;
    } catch (error) {
      // If there's any error in rendering the object, fall back to a simple string representation
      console.error('Error rendering complex object:', error);
      return <p className="text-red-500">Error rendering content</p>;
    }
  }
  
  // Fallback for other types
  return <p>{String(value)}</p>;
};

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
      console.log(`${followupType} diagnosis loaded successfully for ID ${id}`);
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
                  {typeof diagnosis.diagnosis === 'string' ? (
                    <p className="whitespace-pre-wrap">{diagnosis.diagnosis}</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Handle complex diagnosis object structure for pillar follow-ups */}
                      {diagnosis.diagnosis.summary && (
                        <div>
                          <h4 className="font-medium text-md">Summary:</h4>
                          <SafeRender value={diagnosis.diagnosis.summary} />
                        </div>
                      )}
                      
                      {diagnosis.diagnosis.situationAnalysis && (
                        <div>
                          <h4 className="font-medium text-md">Situation Analysis:</h4>
                          <SafeRender value={diagnosis.diagnosis.situationAnalysis} />
                        </div>
                      )}
                      
                      {diagnosis.diagnosis.progressAnalysis && (
                        <div>
                          <h4 className="font-medium text-md">Progress Analysis:</h4>
                          <SafeRender value={diagnosis.diagnosis.progressAnalysis} />
                        </div>
                      )}
                      
                      {diagnosis.diagnosis.implementationEffectiveness && (
                        <div>
                          <h4 className="font-medium text-md">Implementation Effectiveness:</h4>
                          <SafeRender value={diagnosis.diagnosis.implementationEffectiveness} />
                        </div>
                      )}
                      
                      {diagnosis.diagnosis.adjustedRecommendations && (
                        <div>
                          <h4 className="font-medium text-md">Adjusted Recommendations:</h4>
                          <SafeRender value={diagnosis.diagnosis.adjustedRecommendations} />
                        </div>
                      )}
                      
                      {diagnosis.diagnosis.continuedGrowthPlan && (
                        <div>
                          <h4 className="font-medium text-md">Continued Growth Plan:</h4>
                          <SafeRender value={diagnosis.diagnosis.continuedGrowthPlan} />
                        </div>
                      )}
                      
                      {diagnosis.diagnosis.strengths && diagnosis.diagnosis.strengths.length > 0 && (
                        <div>
                          <h4 className="font-medium text-md">Strengths:</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {diagnosis.diagnosis.strengths.map((strength: any, index: number) => (
                              <li key={`strength-${index}`} className="text-gray-800">
                                {typeof strength === 'string' ? strength : <SafeRender value={strength} />}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {diagnosis.diagnosis.challenges && diagnosis.diagnosis.challenges.length > 0 && (
                        <div>
                          <h4 className="font-medium text-md">Challenges:</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {diagnosis.diagnosis.challenges.map((challenge: any, index: number) => (
                              <li key={`challenge-${index}`} className="text-gray-800">
                                {typeof challenge === 'string' ? challenge : <SafeRender value={challenge} />}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {diagnosis.diagnosis.actionableRecommendations && diagnosis.diagnosis.actionableRecommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-md">Actionable Recommendations:</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {diagnosis.diagnosis.actionableRecommendations.map((rec: any, index: number) => (
                              <li key={`rec-${index}`} className="text-gray-800">
                                {typeof rec === 'string' ? rec : <SafeRender value={rec} />}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
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
                    {diagnosis.recommendations.map((recommendation: any, index: number) => (
                      <li key={index} className="text-gray-800">
                        {typeof recommendation === 'string' ? (
                          recommendation
                        ) : (
                          <SafeRender value={recommendation} />
                        )}
                      </li>
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
