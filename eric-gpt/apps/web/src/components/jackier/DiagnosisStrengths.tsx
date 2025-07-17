import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DiagnosisStrengthsProps {
  strengths: string[];
}

export function DiagnosisStrengths({ strengths }: DiagnosisStrengthsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leadership Strengths</CardTitle>
        <CardDescription>
          Areas where you demonstrate strong leadership capabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5 space-y-2">
          {strengths.map((strength, index) => (
            <li key={index} className="pl-2">
              {strength}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
