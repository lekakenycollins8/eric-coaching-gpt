import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import Submission from '@/models/Submission';
import Worksheet from '@/models/Worksheet';
import { generateCoachingFeedback } from '@/services/openai';
import { formatUserPrompt, getSystemPromptForWorksheet } from '@/config/prompts';
import { hasUserExceededQuota, recordSubmissionUsage, getUserRemainingQuota } from '@/services/quotaManager';

// Define validation schema for submission requests
const submissionSchema = z.object({
  worksheetId: z.string(),
  answers: z.record(z.any()),
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
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
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
    
    // Parse and validate the request body
    const body = await request.json();
    
    try {
      submissionSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }
    
    const { worksheetId, answers } = body;
    
    // Connect to the database
    await connectToDatabase();
    
    // Get the worksheet to verify it exists and get its title
    const worksheet = await Worksheet.findOne({ id: worksheetId });
    
    if (!worksheet) {
      return NextResponse.json(
        { error: 'Worksheet not found' },
        { status: 404 }
      );
    }
    
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
        id: submission._id,
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
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
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
