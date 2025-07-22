import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface FollowupWorksheetCardProps {
  id: string;
  title: string;
  description: string;
  onStart: (id: string) => void;
  variant?: 'pillar' | 'followup';
}

export function FollowupWorksheetCard({ 
  id, 
  title, 
  description, 
  onStart,
  variant = 'pillar'
}: FollowupWorksheetCardProps) {
  // Different styling for pillar vs followup worksheets
  const borderClass = variant === 'pillar' ? 'border-blue-400' : 'border-purple-400';
  const bgClass = variant === 'pillar' ? 'bg-blue-50' : 'bg-purple-50';
  const buttonClass = variant === 'pillar' 
    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
    : 'bg-purple-600 hover:bg-purple-700 text-white';
  
  return (
    <Card className={`${borderClass} overflow-hidden`}>
      <div className={`${bgClass} px-6 py-2`}>
        <p className="text-xs uppercase font-semibold tracking-wide">
          {variant === 'pillar' ? 'Core Leadership Pillar' : 'Implementation Support'}
        </p>
      </div>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {variant === 'pillar' 
            ? 'This worksheet will help you develop specific leadership skills related to this pillar.'
            : 'This follow-up worksheet will help you integrate insights from your diagnosis.'}
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onStart(id)} 
          className={`w-full ${buttonClass}`}
        >
          Start Worksheet
        </Button>
      </CardFooter>
    </Card>
  );
}
