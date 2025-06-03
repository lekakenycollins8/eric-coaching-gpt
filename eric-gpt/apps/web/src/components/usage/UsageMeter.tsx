'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UsageMeterProps {
  current: number;
  limit: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

/**
 * Component to display a usage meter with progress bar
 */
const UsageMeter: React.FC<UsageMeterProps> = ({
  current,
  limit,
  label,
  size = 'md',
  showText = true,
  className,
}) => {
  // Calculate percentage used
  const percentage = Math.min(Math.round((current / limit) * 100), 100);
  
  // Determine color based on usage
  const getColorClass = () => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-primary';
  };
  
  // Determine size class
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-2';
      case 'lg': return 'h-4';
      default: return 'h-3';
    }
  };
  
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showText) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showText && (
            <span className="text-muted-foreground">
              {current} / {limit} ({percentage}%)
            </span>
          )}
        </div>
      )}
      <div className={cn('relative w-full overflow-hidden rounded-full bg-secondary', getSizeClass())}>  
        <div 
          className={cn('h-full transition-all', getColorClass())} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default UsageMeter;
