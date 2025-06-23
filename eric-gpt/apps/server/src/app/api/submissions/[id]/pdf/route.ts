import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import Submission, { ISubmission } from '@/models/Submission';
import mongoose from 'mongoose';
// Import puppeteer-core and chromium-min for Vercel compatibility
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
// Conditionally import regular puppeteer for development environment

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Access id from params using proper pattern for Next.js 14+
    const { id } = await params;
    
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
    const submission: ISubmission | null = await Submission.findById(id);
    
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
    const pdf = await generatePDF(id, userId);
    
    // Return the PDF as a response
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="worksheet-${submission.worksheetId}-${id}.pdf"`,
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

/**
 * Generate a PDF from the submission template page
 */
async function generatePDF(submissionId: string, userId?: string): Promise<Buffer> {
  // Get the base URL from environment variables or use a default
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  // Include userId as a query parameter if provided
  const templateUrl = userId
    ? `${webAppUrl}/pdf-template/${submissionId}?userId=${userId}`
    : `${webAppUrl}/pdf-template/${submissionId}`;
  
  console.log(`Generating PDF from template URL: ${templateUrl}`);
  console.log(`Environment: NODE_ENV=${process.env.NODE_ENV}, VERCEL=${process.env.VERCEL}`);
  console.log(`CHROMIUM_PATH=${process.env.CHROMIUM_PATH}`);
  
  let browser;
  try {
    // Choose browser launch strategy based on environment
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.log('Running in production environment, using chromium-min');
      
      try {
        console.log('Attempting to get executablePath...');
        const execPath = await chromium.executablePath(process.env.CHROMIUM_PATH);
        console.log(`Got executablePath: ${execPath}`);
        
        console.log('Launching browser...');
        browser = await puppeteerCore.launch({
          executablePath: execPath,
          args: chromium.args.concat([
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-first-run',
            '--single-process',
            '--no-zygote',
            '--ignore-certificate-errors',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--allow-running-insecure-content',
            '--disable-features=IsolateOrigins,site-per-process'
          ]),
          headless: true
        });
        console.log('Browser launched successfully');
      } catch (chromiumError: unknown) {
        console.error('Error during chromium setup:', chromiumError);
        const errorMessage = chromiumError instanceof Error ? chromiumError.message : 'Unknown error';
        throw new Error(`Chromium setup failed: ${errorMessage}`);
      }
    } else {
      // For local development, use regular puppeteer if available
      // This requires dynamic import since we don't have puppeteer in production
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.default.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--ignore-certificate-errors'
        ]
      });
    }
    
    console.log('Creating new page...');
    const page = await browser.newPage();
    console.log('Page created successfully');
    
    // Set a reasonable timeout for serverless functions
    console.log('Setting navigation timeout...');
    await page.setDefaultNavigationTimeout(25000); // 25 seconds max
    
    try {
      // Navigate to the template URL
      console.log(`Navigating to template URL: ${templateUrl}`);
      try {
        await page.goto(templateUrl, {
          waitUntil: 'networkidle2', // Wait until the network is idle
          timeout: 30000 // 30 seconds timeout
        });
        console.log('Navigation completed successfully');
        
        // Log the page content for debugging
        const pageContent = await page.content();
        console.log(`Page content length: ${pageContent.length} characters`);
        if (pageContent.includes('Error') || pageContent.includes('error')) {
          console.log('Warning: Page content contains error messages');
        }
      } catch (navigationError: unknown) {
        console.error('Navigation error:', navigationError);
        const errorMessage = navigationError instanceof Error ? navigationError.message : 'Unknown navigation error';
        
        // Try a different approach with a longer timeout
        console.log('Trying alternative navigation approach...');
        await page.goto(templateUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 45000 // 45 seconds timeout
        });
        console.log('Alternative navigation completed');
      }
      
      // Wait a bit to ensure everything is loaded
      console.log('Waiting for network to be idle...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate the PDF with optimized settings
      console.log('Generating PDF...');
      try {
        // Try with a simpler PDF configuration first
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px',
          },
          // Lower quality for faster generation in serverless environment
          preferCSSPageSize: true,
        });
        console.log('PDF generated successfully');
        
        return pdf as Buffer;
      } catch (pdfError: unknown) {
        console.error('Error generating PDF with standard options:', pdfError);
        
        // Try with minimal options as a fallback
        console.log('Trying minimal PDF options as fallback...');
        const fallbackPdf = await page.pdf({
          format: 'A4',
          printBackground: false,
          preferCSSPageSize: false,
        });
        console.log('Fallback PDF generated successfully');
        
        return fallbackPdf as Buffer;
      }
    } catch (pageError: unknown) {
      console.error('Error during page operations:', pageError);
      const errorMessage = pageError instanceof Error ? pageError.message : 'Unknown page error';
      throw new Error(`Page operation failed: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error;
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close();
    }
  }
}
