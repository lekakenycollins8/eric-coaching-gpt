import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import Submission from '@/models/Submission';
// Import fs and path for reading the JSON file directly
import fs from 'fs';
import path from 'path';
import { generateCoachingFeedback } from '@/services/openai';
import { formatUserPrompt, getSystemPromptForWorksheet } from '@/config/prompts';
import { 
  hasUserExceededQuota, 
  recordSubmissionUsage, 
  getUserRemainingQuota,
  hasActiveSubscription 
} from '@/services/quotaManager';

// Define validation schema for submission requests
const submissionSchema = z.object({
  worksheetId: z.string(),
  answers: z.record(z.any()),
  userId: z.string().optional(), // Allow userId to be passed from web app
});

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Submit a worksheet for AI coaching feedback
 *     description: Processes worksheet submissions and returns AI-generated coaching feedback
 *     tags:
 *       - Submissions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - worksheetId
 *               - answers
 *             properties:
 *               worksheetId:
 *                 type: string
 *                 description: ID of the worksheet being submitted
 *               answers:
 *                 type: object
 *                 description: User's answers to the worksheet questions
 *     responses:
 *       201:
 *         description: Submission processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: ID of the created submission
 *                 aiFeedback:
 *                   type: string
 *                   description: AI-generated coaching feedback
 *                 remainingQuota:
 *                   type: number
 *                   description: Number of submissions remaining in the current period
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - quota exceeded or insufficient permissions
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body first
    const body = await request.json();
    
    // Get the user ID - either from session or from request body
    let userId: string;
    
    // Try to get from session first (direct API calls)
    const session = await getServerSession(authOptions);
    if (session && session.user && session.user.id) {
      userId = session.user.id;
    } 
    // Otherwise use the userId from the request body (web app proxy)
    else if (body.userId) {
      userId = body.userId;
    } 
    // No authentication found
    else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user has an active subscription
    const hasSubscription = await hasActiveSubscription(userId);
    if (!hasSubscription) {
      return NextResponse.json(
        { 
          error: 'Subscription required',
          message: 'An active subscription is required to submit worksheets. Please subscribe to continue.'
        },
        { status: 403 }
      );
    }
    
    // Check if the user has exceeded their quota
    const hasExceededQuota = await hasUserExceededQuota(userId);
    if (hasExceededQuota) {
      return NextResponse.json(
        { 
          error: 'Quota exceeded',
          message: 'You have reached your monthly submission limit. Please upgrade your plan for more submissions.'
        },
        { status: 403 }
      );
    }
    
    try {
      submissionSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }
    
    const { worksheetId, answers } = body;
    
    // Connect to the database (still needed for submissions)
    await connectToDatabase();
    
    // Get the worksheet from the JSON file instead of the database
    const worksheetsPath = path.join(process.cwd(), 'src/data/worksheets.json');
    const worksheetsData = fs.readFileSync(worksheetsPath, 'utf8');
    const worksheets = JSON.parse(worksheetsData);
    
    // Find the worksheet with the matching ID
    const worksheet = worksheets.find((w: any) => w.id === worksheetId);
    
    if (!worksheet) {
      console.error(`Worksheet not found: ${worksheetId}`);
      return NextResponse.json(
        { error: 'Worksheet not found' },
        { status: 404 }
      );
    }
    
    console.log(`Found worksheet: ${worksheet.title} (${worksheetId})`);

    
    // Get the system prompt for this worksheet type using the systemPromptKey
    const systemPrompt = getSystemPromptForWorksheet(worksheetId, worksheet.systemPromptKey);
    
    // Format the user's answers into a prompt
    const userPrompt = formatUserPrompt(worksheet.title, answers);
    
    // Generate coaching feedback using OpenAI
    const { feedback, tokenUsage } = await generateCoachingFeedback(systemPrompt, userPrompt);
    
    // Create a new submission record
    const submission = new Submission({
      userId,
      worksheetId,
      worksheetTitle: worksheet.title,
      answers,
      aiFeedback: feedback,
      tokensUsed: tokenUsage,
    });
    
    // Save the submission
    await submission.save();
    
    // Record the submission usage for quota tracking
    await recordSubmissionUsage(userId, tokenUsage.totalTokens);
    
    // Get the user's remaining quota
    const remainingQuota = await getUserRemainingQuota(userId);
    
    // Return the feedback and submission ID
    return NextResponse.json(
      {
        id: submission._id.toString(), // Convert MongoDB ObjectId to string
        aiFeedback: feedback,
        remainingQuota,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error processing submission:', error);
    
    return NextResponse.json(
      { error: 'Failed to process submission', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/submissions:
 *   get:
 *     summary: Get user's submissions
 *     description: Retrieves a list of the user's worksheet submissions
 *     tags:
 *       - Submissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of submissions to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       worksheetId:
 *                         type: string
 *                       worksheetTitle:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: number
 *                 page:
 *                   type: number
 *                 limit:
 *                   type: number
 *                 remainingQuota:
 *                   type: number
 *       401:
 *         description: Unauthorized - user not authenticated
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  try {
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
    
    // Parse pagination parameters from the same searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // Connect to the database
    await connectToDatabase();
    
    // Get the user's submissions
    const submissions = await Submission.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('worksheetId worksheetTitle createdAt');
    
    // Count total submissions
    const total = await Submission.countDocuments({ userId });
    
    // Get the user's remaining quota
    const remainingQuota = await getUserRemainingQuota(userId);
    
    // Return the submissions
    return NextResponse.json({
      submissions,
      total,
      page,
      limit,
      remainingQuota,
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch submissions', message: error.message },
      { status: 500 }
    );
  }
}
