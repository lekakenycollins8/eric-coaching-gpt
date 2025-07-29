/**
 * Intelligent redirect proxy route to handle requests to /api/followup/worksheets/diagnosis
 * This redirects to the correct endpoint based on the followup type (pillar or workbook)
 * Also handles worksheet data requests for the diagnosis worksheet
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Intelligent redirect proxy for requests to /api/followup/worksheets/diagnosis
 * This route forwards requests to the correct diagnosis endpoint based on the followup type
 * 
 * @param request The request object
 * @returns Redirects to the correct diagnosis endpoint
 */
export async function GET(request: Request) {
  try {
    // Log the request for debugging
    console.log('LEGACY REQUEST DETECTED: /api/followup/worksheets/diagnosis');
    
    // Get request details for debugging
    const url = new URL(request.url);
    const referrer = request.headers.get('referer') || 'none';
    const submissionId = url.searchParams.get('submissionId');
    const followupId = url.searchParams.get('followupId');
    
    console.log('Request URL:', url.toString());
    console.log('Request referrer:', referrer);
    console.log('User agent:', request.headers.get('user-agent') || 'none');
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Determine if this is a pillar or workbook followup
    const isPillar = followupId && (followupId.includes('pillar') || /^(pillar-\d+|p\d+|[a-z]+-pillar)/.test(followupId));
    
    // Forward the request to the correct endpoint based on type
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const targetEndpoint = isPillar && followupId 
      ? `${serverUrl}/api/followup/diagnosis/${followupId}` 
      : `${serverUrl}/api/followup/diagnosis/workbook`;
    
    console.log(`Web app: Forwarding request to: ${targetEndpoint}`);
    
    // Forward the request with the session cookie and a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const serverResponse = await fetch(targetEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
          'X-Forwarded-From': 'legacy-worksheets-diagnosis',
          'X-Original-Referrer': referrer
        },
        signal: controller.signal,
        credentials: 'include',
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Return the server response
      const data = await serverResponse.json();
      
      if (!serverResponse.ok) {
        return NextResponse.json(
          { error: data.error || 'Error fetching workbook diagnosis from server' }, 
          { status: serverResponse.status }
        );
      }
      
      return NextResponse.json(data);
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      console.error('Error in legacy diagnosis proxy route:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch workbook follow-up diagnosis', 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in legacy diagnosis redirect:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
