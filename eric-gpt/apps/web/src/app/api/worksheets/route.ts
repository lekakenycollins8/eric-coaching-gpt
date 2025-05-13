import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route to forward requests to the server application
 */
export async function GET(request: NextRequest) {
  try {
    // Forward the request to the server application
    const response = await fetch('http://localhost:3000/api/worksheets');
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying worksheets request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worksheets from server' },
      { status: 500 }
    );
  }
}
