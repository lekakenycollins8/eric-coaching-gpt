import React from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface AutoSaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export function AutoSaveStatus({ status }: AutoSaveStatusProps) {
  if (status === 'idle') return null;
  
  return (
    <>
      {status === 'saving' && (
        <span className="text-sm text-muted-foreground flex items-center">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Saving...
        </span>
      )}
      {status === 'saved' && (
        <span className="text-sm text-green-600 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Saved
        </span>
      )}
      {status === 'error' && (
        <span className="text-sm text-red-500 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Save failed
        </span>
      )}
    </>
  );
}
