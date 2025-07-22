import React from 'react';
import { useWorksheetRecommendations } from '@/hooks/useWorksheetRelationships';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RelationshipType } from '@/hooks/useWorksheetRelationships';
import { ArrowRight, Clock, BookOpen, Lightbulb, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface WorksheetRecommendationsProps {
  worksheetId?: string;
  limit?: number;
  showTitle?: boolean;
  onWorksheetSelect?: (worksheetId: string) => void;
}

const relationshipIcons = {
  [RelationshipType.FOLLOW_UP]: <Clock className="h-4 w-4 mr-1" />,
  [RelationshipType.PREREQUISITE]: <BookOpen className="h-4 w-4 mr-1" />,
  [RelationshipType.RECOMMENDED]: <Lightbulb className="h-4 w-4 mr-1" />,
  [RelationshipType.RELATED]: <ArrowRight className="h-4 w-4 mr-1" />,
  [RelationshipType.JACKIER_METHOD]: <CheckCircle2 className="h-4 w-4 mr-1" />
};

const relationshipLabels = {
  [RelationshipType.FOLLOW_UP]: 'Follow-Up',
  [RelationshipType.PREREQUISITE]: 'Prerequisite',
  [RelationshipType.RECOMMENDED]: 'Recommended',
  [RelationshipType.RELATED]: 'Related',
  [RelationshipType.JACKIER_METHOD]: 'Jackier Method'
};

export function WorksheetRecommendations({
  worksheetId,
  limit = 3,
  showTitle = true,
  onWorksheetSelect
}: WorksheetRecommendationsProps) {
  const { 
    data: recommendations, 
    isLoading, 
    error 
  } = useWorksheetRecommendations(worksheetId, limit);

  const handleWorksheetClick = (id: string) => {
    if (onWorksheetSelect) {
      onWorksheetSelect(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showTitle && <h3 className="text-lg font-semibold">Recommended Worksheets</h3>}
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            We encountered an issue loading your worksheet recommendations. 
            Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showTitle && <h3 className="text-lg font-semibold">Recommended Worksheets</h3>}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((recommendation) => (
          <Card 
            key={recommendation.worksheetId} 
            className="border border-gray-200 hover:border-primary/50 transition-colors"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-md">{recommendation.title}</CardTitle>
                <Badge 
                  variant="outline" 
                  className="flex items-center text-xs font-normal"
                >
                  {relationshipIcons[recommendation.relationshipType]}
                  {relationshipLabels[recommendation.relationshipType]}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {recommendation.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="line-clamp-3">{recommendation.contextDescription}</p>
            </CardContent>
            <CardFooter>
              <Link 
                href={`/dashboard/worksheets/${recommendation.worksheetId}`}
                onClick={() => handleWorksheetClick(recommendation.worksheetId)}
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  Open Worksheet
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
