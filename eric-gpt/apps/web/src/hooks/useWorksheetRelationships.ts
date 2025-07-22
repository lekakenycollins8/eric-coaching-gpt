import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export enum RelationshipType {
  FOLLOW_UP = 'follow-up',
  PREREQUISITE = 'prerequisite',
  RECOMMENDED = 'recommended',
  RELATED = 'related',
  JACKIER_METHOD = 'jackier-method'
}

export interface WorksheetRelationship {
  _id: string;
  sourceWorksheetId: string;
  targetWorksheetId: string;
  relationshipType: RelationshipType;
  triggerConditions: {
    type: string;
    parameters: Record<string, any>;
  }[];
  relevanceScore: number;
  contextDescription: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorksheetRecommendation {
  worksheetId: string;
  title: string;
  description: string;
  relevanceScore: number;
  contextDescription: string;
  relationshipType: RelationshipType;
  aiGeneratedContext?: string;
  challengeAreas?: string[];
}

/**
 * Hook for fetching worksheet relationships
 */
export function useWorksheetRelationships(worksheetId: string, direction: 'from' | 'to' | 'both' = 'from') {
  const { data: session, status: authStatus } = useSession();
  
  return useQuery({
    queryKey: ['worksheetRelationships', worksheetId, direction, session?.user?.id],
    queryFn: async () => {
      // Check for authentication
      if (authStatus === 'unauthenticated' || !session?.user) {
        throw new Error('Authentication required');
      }
      
      try {
        const url = `/api/worksheets/relationships?worksheetId=${worksheetId}&direction=${direction}`;
        console.log('Fetching worksheet relationships from:', url);
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required');
          } else if (response.status === 403) {
            throw new Error('Subscription required for worksheet relationships');
          } else {
            // Try to get error details from response
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              console.error('Relationships API error response:', errorData);
              throw new Error(errorData.error || `Failed to fetch worksheet relationships: ${response.status}`);
            } else {
              const errorText = await response.text().catch(() => 'Could not read error response');
              console.error('Relationships API error response:', errorText);
              throw new Error(`Failed to fetch worksheet relationships: ${response.status}`);
            }
          }
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.relationships) {
            return data.relationships as WorksheetRelationship[];
          } else {
            console.warn('Unexpected response format - missing relationships array:', data);
            return [];
          }
        } else {
          const responseText = await response.text().catch(() => 'Could not read response');
          console.error('Non-JSON response received:', responseText);
          throw new Error('Invalid response format: Expected JSON but received different content type');
        }
      } catch (error) {
        console.error('Error in useWorksheetRelationships:', error);
        throw error;
      }
    },
    enabled: !!session?.user && !!worksheetId
  });
}

/**
 * Hook for fetching worksheet recommendations
 */
export function useWorksheetRecommendations(worksheetId?: string, limit: number = 5) {
  const { data: session, status: authStatus } = useSession();
  
  return useQuery({
    queryKey: ['worksheetRecommendations', worksheetId, limit, session?.user?.id],
    queryFn: async () => {
      // Check for authentication
      if (authStatus === 'unauthenticated' || !session?.user) {
        throw new Error('Authentication required');
      }
      
      try {
        // Build the URL with query parameters
        let url = `/api/worksheets/recommendations?limit=${limit}`;
        if (worksheetId) {
          url += `&worksheetId=${worksheetId}`;
        }
        
        console.log('Fetching worksheet recommendations from:', url);
        
        // Make the request
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });
        
        // Handle error responses
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required');
          } else if (response.status === 403) {
            throw new Error('Subscription required for worksheet recommendations');
          } else {
            // Try to get error details from response
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              console.error('Recommendations API error response:', errorData);
              throw new Error(errorData.error || `Failed to fetch worksheet recommendations: ${response.status}`);
            } else {
              const errorText = await response.text().catch(() => 'Could not read error response');
              console.error('Recommendations API error response:', errorText);
              throw new Error(`Failed to fetch worksheet recommendations: ${response.status}`);
            }
          }
        }
        
        // Check for JSON content type
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.recommendations) {
            return data.recommendations as WorksheetRecommendation[];
          } else {
            console.warn('Unexpected response format - missing recommendations array:', data);
            return [];
          }
        } else {
          const responseText = await response.text().catch(() => 'Could not read response');
          console.error('Non-JSON response received:', responseText);
          throw new Error('Invalid response format: Expected JSON but received different content type');
        }
      } catch (error) {
        console.error('Error in useWorksheetRecommendations:', error);
        throw error;
      }
    },
    enabled: !!session?.user
  });
}
