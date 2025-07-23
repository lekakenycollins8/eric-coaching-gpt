import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PillarRecommendation {
  id: string;
  title: string;
  reason: string;
  relevanceScore: number;
}

interface PillarRecommendationsProps {
  pillarRecommendations?: PillarRecommendation[];
}

export function PillarRecommendations({ pillarRecommendations }: PillarRecommendationsProps) {
  if (!pillarRecommendations || pillarRecommendations.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Why These Pillars Were Recommended</CardTitle>
        <CardDescription>
          Detailed explanation of why each leadership pillar was selected for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {pillarRecommendations.map((pillar, index) => (
            <div key={index} className="border-b pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">
                  {pillar.title.replace(/pillar(\d+)_/i, 'Pillar #$1: ').replace(/_/g, ' ')}
                </h3>
                <Badge variant="outline" className="bg-blue-50">
                  Relevance: {pillar.relevanceScore}/10
                </Badge>
              </div>
              <p className="text-muted-foreground">{pillar.reason}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
