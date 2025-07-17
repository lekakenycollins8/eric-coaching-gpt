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
  const borderClass = variant === 'pillar' ? 'border-blue-400' : 'border-purple-400';
  
  return (
    <Card className={borderClass}>
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
            : 'This follow-up worksheet will help you integrate insights from your diagnosis.'
          }
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onStart(id)} 
          variant="outline" 
          className="w-full"
        >
          Start Worksheet
        </Button>
      </CardFooter>
    </Card>
  );
}
