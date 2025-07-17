import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DiagnosisRecommendationsProps {
  recommendations: string[];
}

export function DiagnosisRecommendations({ recommendations }: DiagnosisRecommendationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
        <CardDescription>
          Specific actions to enhance your leadership effectiveness
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5 space-y-2">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="pl-2">
              {recommendation}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
