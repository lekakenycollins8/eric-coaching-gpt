import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface GrowthAreaAnalysis {
  area: string;
  evidence: string;
  impact: string;
  rootCause: string;
}

interface DetailedGrowthAnalysisProps {
  growthAreasAnalysis?: GrowthAreaAnalysis[];
}

export function DetailedGrowthAnalysis({ growthAreasAnalysis }: DetailedGrowthAnalysisProps) {
  if (!growthAreasAnalysis || growthAreasAnalysis.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Detailed Growth Area Analysis</CardTitle>
        <CardDescription>
          In-depth analysis of your leadership development opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {growthAreasAnalysis.map((item, index) => (
            <AccordionItem key={index} value={`growth-${index}`}>
              <AccordionTrigger className="font-medium text-left">
                {item.area}
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
                    <h4 className="font-semibold text-sm">Root Cause</h4>
                    <p className="text-sm text-muted-foreground">{item.rootCause}</p>
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
