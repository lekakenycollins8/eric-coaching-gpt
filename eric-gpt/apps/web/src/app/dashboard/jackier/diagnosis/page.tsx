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
import type { PillarRecommendation } from '@/hooks/useJackierWorkbook';

// Import our custom components
import { DiagnosisSummary } from '@/components/jackier/DiagnosisSummary';
import { DiagnosisStrengths } from '@/components/jackier/DiagnosisStrengths';
import { DiagnosisChallenges } from '@/components/jackier/DiagnosisChallenges';
import { DiagnosisRecommendations } from '@/components/jackier/DiagnosisRecommendations';
import { FollowupWorksheetCard } from '@/components/jackier/FollowupWorksheetCard';
import { LoadingState } from '@/components/jackier/LoadingState';
import { ErrorState } from '@/components/jackier/ErrorState';

// Import our enhanced diagnosis components
import { DetailedStrengthAnalysis } from '@/components/jackier/DetailedStrengthAnalysis';
import { DetailedGrowthAnalysis } from '@/components/jackier/DetailedGrowthAnalysis';
import { ActionableRecommendations } from '@/components/jackier/ActionableRecommendations';
import { PillarRecommendations } from '@/components/jackier/PillarRecommendations';
import { SituationAnalysis } from '@/components/jackier/SituationAnalysis';
import { FollowupRecommendationDetail } from '@/components/jackier/FollowupRecommendationDetail';

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
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="situation">Situation</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <DiagnosisSummary summary={diagnosis.summary} />
          {diagnosis.situationAnalysis && (
            <SituationAnalysis situationAnalysis={diagnosis.situationAnalysis} />
          )}
        </TabsContent>
        
        <TabsContent value="strengths">
          <DiagnosisStrengths strengths={diagnosis.strengths} />
          {diagnosis.strengthsAnalysis && diagnosis.strengthsAnalysis.length > 0 && (
            <DetailedStrengthAnalysis strengthsAnalysis={diagnosis.strengthsAnalysis} />
          )}
        </TabsContent>
        
        <TabsContent value="challenges">
          <DiagnosisChallenges challenges={diagnosis.challenges} />
          {diagnosis.growthAreasAnalysis && diagnosis.growthAreasAnalysis.length > 0 && (
            <DetailedGrowthAnalysis growthAreasAnalysis={diagnosis.growthAreasAnalysis} />
          )}
        </TabsContent>
        
        <TabsContent value="recommendations">
          <DiagnosisRecommendations recommendations={diagnosis.recommendations} />
          {diagnosis.actionableRecommendations && diagnosis.actionableRecommendations.length > 0 && (
            <ActionableRecommendations actionableRecommendations={diagnosis.actionableRecommendations} />
          )}
        </TabsContent>

        <TabsContent value="situation">
          {diagnosis.situationAnalysis ? (
            <SituationAnalysis situationAnalysis={diagnosis.situationAnalysis} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Situation Analysis</CardTitle>
                <CardDescription>Analysis of your current leadership context</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No detailed situation analysis available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="detailed">
          <div className="space-y-6">
            {diagnosis.pillarRecommendations && diagnosis.pillarRecommendations.length > 0 && (
              <PillarRecommendations pillarRecommendations={diagnosis.pillarRecommendations} />
            )}
            
            {diagnosis.followupRecommendation && (
              <FollowupRecommendationDetail followupRecommendation={diagnosis.followupRecommendation} />
            )}
            
            {!diagnosis.pillarRecommendations && !diagnosis.followupRecommendation && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analysis</CardTitle>
                  <CardDescription>In-depth analysis of your leadership profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No detailed analysis available.</p>
                </CardContent>
              </Card>
            )}
          </div>
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
                // Find matching pillar recommendation if available
                const pillarRec = diagnosis.pillarRecommendations?.find((p: PillarRecommendation) => p.id === pillarId);
                
                return (
                  <FollowupWorksheetCard
                    key={pillarId}
                    id={pillarId}
                    title={pillarId.replace(/pillar(\d+)_/i, 'Pillar #$1: ').replace(/_/g, ' ')}
                    description={pillarRec ? pillarRec.reason : "Build your leadership foundation with this core pillar worksheet"}
                    onStart={(id) => handleStartWorksheet(id, 'pillar')}
                    variant="pillar"
                  />
                );
              })}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>For a detailed explanation of why these pillars were recommended, check the "Detailed" tab above.</p>
            </div>
          </div>
        )}
        
        {diagnosis.followupWorksheets.followup && (
          <div>
            <h3 className="text-xl font-semibold mb-3">Implementation Support</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const followupId = diagnosis.followupWorksheets.followup;
                // Find matching followup recommendation if available
                const followupRec = diagnosis.followupRecommendation;
                
                return (
                  <FollowupWorksheetCard
                    id={followupId}
                    title={followupId.replace(/_/g, ' ')}
                    description={followupRec ? followupRec.reason : "Deepen your learning with this targeted follow-up worksheet"}
                    onStart={(id) => handleStartWorksheet(id, 'followup')}
                    variant="followup"
                  />
                );
              })()}
            </div>
            {diagnosis.followupRecommendation && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p>This worksheet was selected because it {diagnosis.followupRecommendation.connection}</p>
                <p className="mt-2">For a detailed explanation, check the "Detailed" tab above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
