'use client';

import { useState, useEffect } from 'react';
import type { Worksheet, WorksheetResponse } from '@/types/worksheet';

/**
 * Hook to fetch all available worksheets
 */
export function useWorksheets() {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorksheets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/worksheets');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch worksheets: ${response.status}`);
        }
        
        const data = await response.json() as WorksheetResponse;
        setWorksheets(data.worksheets);
      } catch (err) {
        console.error('Error fetching worksheets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch worksheets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorksheets();
  }, []);

  return { worksheets, isLoading, error };
}

/**
 * Hook to fetch a specific worksheet by ID
 */
export function useWorksheet(id: string) {
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorksheet = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/worksheets/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Worksheet not found: ${id}`);
          }
          throw new Error(`Failed to fetch worksheet: ${response.status}`);
        }
        
        const data = await response.json() as Worksheet;
        setWorksheet(data);
      } catch (err) {
        console.error(`Error fetching worksheet ${id}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to fetch worksheet');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorksheet();
  }, [id]);

  return { worksheet, isLoading, error };
}
