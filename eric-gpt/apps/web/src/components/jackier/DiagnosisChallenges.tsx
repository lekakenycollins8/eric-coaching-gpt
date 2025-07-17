import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DiagnosisChallengesProps {
  challenges: string[];
}

export function DiagnosisChallenges({ challenges }: DiagnosisChallengesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leadership Challenges</CardTitle>
        <CardDescription>
          Areas where you may benefit from focused development
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5 space-y-2">
          {challenges.map((challenge, index) => (
            <li key={index} className="pl-2">
              {challenge}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
