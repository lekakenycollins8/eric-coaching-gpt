import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2 } from 'lucide-react';

interface ActionableRecommendation {
  action: string;
  implementation: string;
  outcome: string;
  measurement: string;
}

interface ActionableRecommendationsProps {
  actionableRecommendations?: ActionableRecommendation[];
}

export function ActionableRecommendations({ actionableRecommendations }: ActionableRecommendationsProps) {
  if (!actionableRecommendations || actionableRecommendations.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Actionable Recommendations</CardTitle>
        <CardDescription>
          Specific actions with implementation steps and expected outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {actionableRecommendations.map((item, index) => (
            <AccordionItem key={index} value={`action-${index}`}>
              <AccordionTrigger className="font-medium text-left">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                  <span>{item.action}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div>
                    <h4 className="font-semibold text-sm">Implementation Steps</h4>
                    <p className="text-sm text-muted-foreground">{item.implementation}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Expected Outcome</h4>
                    <p className="text-sm text-muted-foreground">{item.outcome}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">How to Measure Success</h4>
                    <p className="text-sm text-muted-foreground">{item.measurement}</p>
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
