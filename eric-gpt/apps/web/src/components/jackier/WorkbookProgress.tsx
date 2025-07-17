import React from 'react';
import { Progress } from '@/components/ui/progress';

interface WorkbookProgressProps {
  progress: number;
}

export function WorkbookProgress({ progress }: WorkbookProgressProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
