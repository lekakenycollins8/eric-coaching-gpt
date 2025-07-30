import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2 } from 'lucide-react';

// Helper component to safely render potentially complex objects
const SafeRender = ({ value }: { value: any }) => {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string') {
    return <span className="whitespace-pre-wrap">{value}</span>;
  }
  
  if (typeof value === 'object') {
    try {
      // Handle specific object structures we know about
      if ('fullText' in value) {
        return <span className="whitespace-pre-wrap">{value.fullText}</span>;
      }
      
      if ('action' in value) {
        // If only action has content and other fields are empty or undefined, just show the action
        const hasOnlyAction = value.action && 
          (!value.implementation || value.implementation === '') && 
          (!value.outcome || value.outcome === '') && 
          (!value.measurement || value.measurement === '');
          
        if (hasOnlyAction) {
          return <span className="whitespace-pre-wrap">{value.action}</span>;
        }
        
        return (
          <div className="space-y-1">
            {value.action && <p><strong>Action:</strong> {value.action}</p>}
            {value.implementation && <p><strong>Implementation:</strong> {value.implementation}</p>}
            {value.outcome && <p><strong>Outcome:</strong> {value.outcome}</p>}
            {value.measurement && <p><strong>Measurement:</strong> {value.measurement}</p>}
          </div>
        );
      }
      
      // Fallback for unknown object structures
      return <span className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</span>;
    } catch (error) {
      // If there's any error in rendering the object, fall back to a simple string representation
      console.error('Error rendering complex object:', error);
      return <span className="text-red-500">Error rendering content</span>;
    }
  }
  
  // Fallback for other types
  return <span>{String(value)}</span>;
};

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
                  <SafeRender value={item.action} />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div>
                    <h4 className="font-semibold text-sm">Implementation Steps</h4>
                    <div className="text-sm text-muted-foreground"><SafeRender value={item.implementation} /></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Expected Outcome</h4>
                    <div className="text-sm text-muted-foreground"><SafeRender value={item.outcome} /></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">How to Measure Success</h4>
                    <div className="text-sm text-muted-foreground"><SafeRender value={item.measurement} /></div>
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
