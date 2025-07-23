import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StrengthAnalysis {
  strength: string;
  evidence: string;
  impact: string;
  leverage: string;
}

interface DetailedStrengthAnalysisProps {
  strengthsAnalysis?: StrengthAnalysis[];
}

export function DetailedStrengthAnalysis({ strengthsAnalysis }: DetailedStrengthAnalysisProps) {
  if (!strengthsAnalysis || strengthsAnalysis.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Detailed Strength Analysis</CardTitle>
        <CardDescription>
          In-depth analysis of your key leadership strengths
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {strengthsAnalysis.map((item, index) => (
            <AccordionItem key={index} value={`strength-${index}`}>
              <AccordionTrigger className="font-medium text-left">
                {item.strength}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div>
                    <h4 className="font-semibold text-sm">Evidence</h4>
                    <p className="text-sm text-muted-foreground">{item.evidence}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Impact</h4>
                    <p className="text-sm text-muted-foreground">{item.impact}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">How to Leverage</h4>
                    <p className="text-sm text-muted-foreground">{item.leverage}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
