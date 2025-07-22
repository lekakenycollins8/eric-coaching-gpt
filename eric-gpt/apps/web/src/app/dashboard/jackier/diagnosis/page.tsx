'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useJackierWorkbook } from '@/hooks/useJackierWorkbook';

// Import our custom components
import { DiagnosisSummary } from '@/components/jackier/DiagnosisSummary';
import { DiagnosisStrengths } from '@/components/jackier/DiagnosisStrengths';
import { DiagnosisChallenges } from '@/components/jackier/DiagnosisChallenges';
import { DiagnosisRecommendations } from '@/components/jackier/DiagnosisRecommendations';
import { FollowupWorksheetCard } from '@/components/jackier/FollowupWorksheetCard';
import { LoadingState } from '@/components/jackier/LoadingState';
import { ErrorState } from '@/components/jackier/ErrorState';

export default function DiagnosisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    userSubmission, 
    isLoading, 
    error, 
    markDiagnosisViewed 
  } = useJackierWorkbook();
  
  // Mark diagnosis as viewed when the page loads
  useEffect(() => {
    // Debug the userSubmission data
    console.log('Diagnosis page - userSubmission:', userSubmission);
    
    if (userSubmission?.diagnosis && !userSubmission.diagnosisViewedAt) {
      console.log('Marking diagnosis as viewed');
      markDiagnosisViewed();
    }
  }, [userSubmission, markDiagnosisViewed]);
  
  // Handle starting a worksheet - route to correct path based on worksheet type
  const handleStartWorksheet = (worksheetId: string, variant: 'pillar' | 'followup') => {
    // Route pillar worksheets to the pillar path, follow-up worksheets to the follow-up path
    if (variant === 'pillar') {
      router.push(`/dashboard/worksheets/${worksheetId}`);
    } else {
      router.push(`/dashboard/jackier/followup/${worksheetId}`);
    }
  };
  
  if (isLoading) {
    return <LoadingState message="Loading diagnosis..." />;
  }
  
  if (error) {
    return (
      <ErrorState
        title="Error"
        description={error}
        backLink="/dashboard/jackier"
        backLinkText="Back to Jackier Method"
      />
    );
  }
  
  if (!userSubmission || !userSubmission.diagnosis) {
    return (
      <ErrorState
        title="Not Found"
        description="No diagnosis found. Please complete the Jackier Method Workbook first."
        backLink="/dashboard/jackier"
        backLinkText="Back to Jackier Method"
        actionButton={
          <Button onClick={() => router.push('/dashboard/jackier/workbook')}>
            Go to Workbook
          </Button>
        }
      />
    );
  }
  
  const { diagnosis } = userSubmission;
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Link href="/dashboard/jackier">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jackier Method
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Leadership Diagnosis</h1>
        <p className="text-muted-foreground">
          Based on your Jackier Method Workbook responses, we've prepared a personalized leadership diagnosis.
        </p>
      </div>
      
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <DiagnosisSummary summary={diagnosis.summary} />
        </TabsContent>
        
        <TabsContent value="strengths">
          <DiagnosisStrengths strengths={diagnosis.strengths} />
        </TabsContent>
        
        <TabsContent value="challenges">
          <DiagnosisChallenges challenges={diagnosis.challenges} />
        </TabsContent>
        
        <TabsContent value="recommendations">
          <DiagnosisRecommendations recommendations={diagnosis.recommendations} />
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Your Leadership Development Path</h2>
        <div className="p-4 border border-amber-200 bg-amber-50 rounded-md mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Need personalized coaching?</p>
              <p className="text-sm text-amber-700">If you're facing complex leadership challenges, Eric offers personalized coaching to help you implement these insights effectively.</p>
              <Button variant="outline" className="mt-2 text-amber-800 border-amber-300 hover:bg-amber-100" size="sm">
                Learn about coaching options
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-muted-foreground">
            Based on your diagnosis, we've identified specific areas where you can develop your leadership skills.
            {diagnosis.followupWorksheets.pillars?.length > 0 && (
              <span> We recommend starting with the core pillar worksheets below to build your foundation.</span>
            )}
            {diagnosis.followupWorksheets.followup && (
              <span> For targeted improvement, we also suggest a specific follow-up worksheet.</span>
            )}
          </p>
        </div>
        
        {diagnosis.followupWorksheets.pillars?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-3">Core Leadership Pillars</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {diagnosis.followupWorksheets.pillars.map((pillarId) => {
                return (
                  <FollowupWorksheetCard
                    key={pillarId}
                    id={pillarId}
                    title={pillarId.replace(/pillar(\d+)_/i, 'Pillar #$1: ').replace(/_/g, ' ')}
                    description="Build your leadership foundation with this core pillar worksheet"
                    onStart={(id) => handleStartWorksheet(id, 'pillar')}
                    variant="pillar"
                  />
                );
              })}
            </div>
          </div>
        )}
        
        {diagnosis.followupWorksheets.followup && (
          <div>
            <h3 className="text-xl font-semibold mb-3">Implementation Support</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const followupId = diagnosis.followupWorksheets.followup;
                
                return (
                  <FollowupWorksheetCard
                    id={followupId}
                    title={followupId.replace(/_/g, ' ')}
                    description="Deepen your learning with this targeted follow-up worksheet"
                    onStart={(id) => handleStartWorksheet(id, 'followup')}
                    variant="followup"
                  />
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
