'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFollowupRecommendations, useFilteredRecommendations } from '@/hooks/useFollowupRecommendations';
import type { FollowupRecommendation } from '@/types/followup';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { FollowupCategoryType } from '@/types/followup';

export function FollowupRecommendations() {
  const [activeTab, setActiveTab] = useState<FollowupCategoryType>('pillar');
  
  // Fetch all recommendations
  const { 
    data: allRecommendations,
    isLoading,
    error
  } = useFollowupRecommendations();
  
  // Filter recommendations by type
  const recommendations = allRecommendations?.recommendations || [];
  const pillarRecommendations = useFilteredRecommendations(recommendations, 'pillar');
  const workbookRecommendations = useFilteredRecommendations(recommendations, 'workbook');
  
  // Get active recommendations based on selected tab
  const activeRecommendations = activeTab === 'pillar' 
    ? pillarRecommendations 
    : workbookRecommendations;
  
  if (isLoading) {
    return <FollowupRecommendationsSkeleton />;
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load follow-up recommendations. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (activeRecommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Recommendations</CardTitle>
          <CardDescription>
            Track your progress and get recommendations for follow-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Recommendations</AlertTitle>
            <AlertDescription>
              You don't have any follow-up recommendations at this time. Complete more worksheets to get recommendations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up Recommendations</CardTitle>
        <CardDescription>
          Track your progress and get recommendations for follow-ups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pillar" value={activeTab} onValueChange={(value) => setActiveTab(value as FollowupCategoryType)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pillar">Pillar Follow-ups</TabsTrigger>
            <TabsTrigger value="workbook">Workbook Follow-ups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pillar" className="space-y-4">
            {pillarRecommendations.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Pillar Recommendations</AlertTitle>
                <AlertDescription>
                  You don't have any pillar follow-up recommendations at this time.
                </AlertDescription>
              </Alert>
            ) : (
              pillarRecommendations.map((recommendation) => (
                <RecommendationCard key={recommendation.followupId} recommendation={recommendation} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="workbook" className="space-y-4">
            {workbookRecommendations.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Workbook Recommendations</AlertTitle>
                <AlertDescription>
                  You don't have any workbook follow-up recommendations at this time.
                </AlertDescription>
              </Alert>
            ) : (
              workbookRecommendations.map((recommendation) => (
                <RecommendationCard key={recommendation.followupId} recommendation={recommendation} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Individual recommendation card
function RecommendationCard({ recommendation }: { recommendation: FollowupRecommendation }) {
  const priorityColors = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-orange-100 text-orange-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-green-100 text-green-800',
    5: 'bg-blue-100 text-blue-800',
  };
  
  const priorityColor = priorityColors[recommendation.priority as keyof typeof priorityColors] || priorityColors[3];
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{recommendation.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {recommendation.description}
            </CardDescription>
          </div>
          <Badge className={priorityColor}>
            Priority {recommendation.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1" />
          <span>{recommendation.timeElapsed}</span>
        </div>
        <div className="mt-2 text-sm">
          Based on: {recommendation.originalTitle}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Link href={`/dashboard/followup/${recommendation.followupId}?submission=${recommendation.originalSubmissionId}`}>
          <Button>
            Start Follow-up <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Skeleton loader for recommendations
export function FollowupRecommendationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end">
                <Skeleton className="h-10 w-32" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
