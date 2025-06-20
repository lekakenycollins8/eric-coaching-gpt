import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route to forward requests for individual worksheets to the server application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Access params.id asynchronously to comply with Next.js 14+ requirements
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Worksheet ID is required' },
        { status: 400 }
      );
    }
    
    // Forward the request to the server application
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${serverUrl}/api/worksheets/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Worksheet not found: ${id}` },
          { status: 404 }
        );
      }
      
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying worksheet request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worksheet from server' },
      { status: 500 }
    );
  }
}
