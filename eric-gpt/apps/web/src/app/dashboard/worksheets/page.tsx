'use client';

import React from 'react';

/**
 * Helper function to extract pillar number from worksheet ID
 * Handles the format used in the JSON files: pillar1_leadership_mindset
 */
function getPillarNumber(id: string): string {
  // The actual format used in the JSON files is pillar1_leadership_mindset
  if (id && id.toLowerCase().startsWith('pillar')) {
    const match = id.match(/pillar(\d+)/i);
    if (match && match[1]) {
      return `Pillar #${match[1]}`;
    }
  }
  
  // If we can't parse the ID, just return a generic label
  return 'Worksheet';
}
import Link from 'next/link';
import { useWorksheets } from '@/hooks/useWorksheets';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function WorksheetsPage() {
  const { worksheets, isLoading, error } = useWorksheets();

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leadership Worksheets</h1>
        <p className="text-muted-foreground">
          Complete these worksheets to receive personalized coaching feedback from Eric GPT.
        </p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {worksheets.map((worksheet) => (
            <Card key={worksheet.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{worksheet.title}</CardTitle>
                <CardDescription>
                  {getPillarNumber(worksheet.id)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{worksheet.description}</p>
              </CardContent>
              <CardFooter>
                <Link href={`/dashboard/worksheets/${worksheet.id}`} className="w-full">
                  <Button variant="default" className="w-full">
                    Start Worksheet
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
