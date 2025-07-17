import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DiagnosisSummaryProps {
  summary: string;
}

export function DiagnosisSummary({ summary }: DiagnosisSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leadership Summary</CardTitle>
        <CardDescription>
          Overview of your leadership profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{summary}</p>
      </CardContent>
    </Card>
  );
}
