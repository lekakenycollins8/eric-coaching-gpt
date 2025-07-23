import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SituationAnalysisData {
  context?: string;
  challenges?: string;
  patterns?: string;
  impact?: string;
  fullText: string;
}

interface SituationAnalysisProps {
  situationAnalysis?: SituationAnalysisData;
}

export function SituationAnalysis({ situationAnalysis }: SituationAnalysisProps) {
  if (!situationAnalysis) {
    return null;
  }

  // If we only have the fullText but no structured data
  if (!situationAnalysis.context && !situationAnalysis.challenges && 
      !situationAnalysis.patterns && !situationAnalysis.impact) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Situation Analysis</CardTitle>
          <CardDescription>
            Analysis of your current leadership situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{situationAnalysis.fullText}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Situation Analysis</CardTitle>
        <CardDescription>
          Comprehensive analysis of your leadership context and challenges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="context" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="context">Context</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="context" className="pt-4">
            <h3 className="font-semibold mb-2">Leadership Context</h3>
            <p className="text-muted-foreground">{situationAnalysis.context || 'No context information available.'}</p>
          </TabsContent>
          
          <TabsContent value="challenges" className="pt-4">
            <h3 className="font-semibold mb-2">Current Challenges</h3>
            <p className="text-muted-foreground">{situationAnalysis.challenges || 'No challenges information available.'}</p>
          </TabsContent>
          
          <TabsContent value="patterns" className="pt-4">
            <h3 className="font-semibold mb-2">Behavioral Patterns</h3>
            <p className="text-muted-foreground">{situationAnalysis.patterns || 'No patterns information available.'}</p>
          </TabsContent>
          
          <TabsContent value="impact" className="pt-4">
            <h3 className="font-semibold mb-2">Organizational Impact</h3>
            <p className="text-muted-foreground">{situationAnalysis.impact || 'No impact information available.'}</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
