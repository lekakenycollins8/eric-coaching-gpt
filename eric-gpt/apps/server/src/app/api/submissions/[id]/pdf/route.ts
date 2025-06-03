import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import Submission from '@/models/Submission';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/submissions/{id}/pdf:
 *   get:
 *     summary: Generate a PDF for a specific submission
 *     description: Creates a PDF document from a worksheet submission and its feedback
 *     tags:
 *       - Submissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The submission ID
 *     responses:
 *       200:
 *         description: PDF document
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user doesn't have access to this submission
 *       404:
 *         description: Submission not found
 *       500:
 *         description: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate submission ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid submission ID format' },
        { status: 400 }
      );
    }
    
    // Get the user ID - either from session or from query parameters
    let userId: string;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get('userId');
    
    // Try to get from session first (direct API calls)
    const session = await getServerSession(authOptions);
    if (session && session.user && session.user.id) {
      userId = session.user.id;
    }
    // Otherwise use the userId from query parameters (web app proxy)
    else if (userIdParam) {
      userId = userIdParam;
    }
    // No authentication found
    else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the submission by ID
    const submission = await Submission.findById(id);
    
    // Check if the submission exists
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has access to this submission
    if (submission.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this submission' },
        { status: 403 }
      );
    }
    
    // Generate the PDF using Puppeteer
    const pdf = await generatePDF(id);
    
    // Return the PDF as a response
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="worksheet-${submission.worksheetId}-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate PDF', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate a PDF from the submission template page
 */
async function generatePDF(submissionId: string): Promise<Buffer> {
  // Get the base URL from environment variables or use a default
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const templateUrl = `${webAppUrl}/pdf-template/${submissionId}`;
  
  console.log(`Generating PDF from template URL: ${templateUrl}`);
  
  // Launch a headless browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Navigate to the template URL
    await page.goto(templateUrl, {
      waitUntil: 'networkidle2', // Wait until the network is idle
    });
    
    // Generate the PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    return pdf;
  } finally {
    // Always close the browser
    await browser.close();
  }
}
