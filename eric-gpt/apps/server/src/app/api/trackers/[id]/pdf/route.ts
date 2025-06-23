import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Tracker, TrackerEntry, TrackerReflection } from '@/models';
import mongoose from 'mongoose';
// Import puppeteer-core and chromium-min for Vercel compatibility
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
// Conditionally import regular puppeteer for development environment

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/trackers/{id}/pdf:
 *   get:
 *     summary: Generate a PDF for a specific tracker
 *     description: Creates a PDF document from a tracker with its entries and reflection
 *     tags:
 *       - Trackers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tracker ID
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
 *         description: Forbidden - user doesn't have access to this tracker
 *       404:
 *         description: Tracker not found
 *       500:
 *         description: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    // Access id from params
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tracker ID is required' },
        { status: 400 }
      );
    }
    
    // Validate tracker ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid tracker ID format' },
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
    
    // Find the tracker by ID
    const tracker = await Tracker.findById(id);
    
    // Check if the tracker exists
    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has access to this tracker
    if (tracker.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this tracker' },
        { status: 403 }
      );
    }
    
    // Generate the PDF using Puppeteer
    const pdf = await generatePDF(id, userId);
    
    // Return the PDF as a response
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tracker-${id}.pdf"`,
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
 * Generate a PDF from the tracker template page
 */
async function generatePDF(trackerId: string, userId?: string): Promise<Buffer> {
  // Get the base URL from environment variables or use a default
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  // Include userId as a query parameter if provided
  const templateUrl = userId
    ? `${webAppUrl}/tracker-pdf-template/${trackerId}?userId=${userId}`
    : `${webAppUrl}/tracker-pdf-template/${trackerId}`;
  
  console.log(`Generating PDF from template URL: ${templateUrl}`);
  console.log(`Environment: NODE_ENV=${process.env.NODE_ENV}, VERCEL=${process.env.VERCEL}`);
  console.log(`CHROMIUM_PATH=${process.env.CHROMIUM_PATH}`);
  
  let browser;
  try {
    // Choose browser launch strategy based on environment
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.log('Running in production environment, using chromium-min');
      
      // Use chromium-min for production/Vercel environment
      browser = await puppeteerCore.launch({
        executablePath: await chromium.executablePath(process.env.CHROMIUM_PATH),
        args: chromium.args.concat([
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--single-process',
          '--no-zygote'
        ])
      });
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
          '--disable-gpu'
        ],
        ignoreHTTPSErrors: true
      });
    }
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set a reasonable timeout for serverless functions
    await page.setDefaultNavigationTimeout(25000); // 25 seconds max
    
    // Navigate to the template URL
    await page.goto(templateUrl, {
      waitUntil: 'networkidle2', // Wait until the network is idle
    });
    
    // Generate the PDF with optimized settings
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
    
    return pdf as Buffer;
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
