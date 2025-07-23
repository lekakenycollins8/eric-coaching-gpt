import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FollowupRecommendation {
  id: string;
  title: string;
  reason: string;
  connection: string;
  focus: string;
}

interface FollowupRecommendationDetailProps {
  followupRecommendation?: FollowupRecommendation;
}

export function FollowupRecommendationDetail({ followupRecommendation }: FollowupRecommendationDetailProps) {
  if (!followupRecommendation) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Follow-up Worksheet Recommendation</CardTitle>
        <CardDescription>
          Why this specific follow-up worksheet was selected for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">
              {followupRecommendation.title.replace(/_/g, ' ')}
            </h3>
            <p className="text-muted-foreground">{followupRecommendation.reason}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm">Connection to Your Situation</h4>
            <p className="text-sm text-muted-foreground">{followupRecommendation.connection}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm">What to Focus On</h4>
            <p className="text-sm text-muted-foreground">{followupRecommendation.focus}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
