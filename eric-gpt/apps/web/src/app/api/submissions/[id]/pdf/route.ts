import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Proxy endpoint to forward PDF generation requests to the server
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Access params using proper pattern for Next.js 14+
    const { id } = await context.params;
    
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get the server URL from environment variables
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // Ensure this matches the actual server endpoint structure
    const apiUrl = `${serverUrl}/api/submissions/${id}/pdf?userId=${userId}`;
    
    // Forward the request to the server
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // If the response is not OK, return the error
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to generate PDF' },
        { status: response.status }
      );
    }
    
    // Get the PDF buffer
    const pdfBuffer = await response.arrayBuffer();
    
    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': response.headers.get('Content-Disposition') || 'attachment; filename="worksheet.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to generate PDF', message: errorMessage },
      { status: 500 }
    );
  }
}
