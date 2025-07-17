import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/models';
import WorkbookSubmission from '@/models/WorkbookSubmission';
import mongoose from 'mongoose';
import { loadWorkbook } from '@/utils/workbookLoader';
import { generateAIDiagnosis, DiagnosisResponse, FormattedQA, determineFollowupWorksheets } from '@/utils/diagnosisUtils';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/diagnosis:
 *   post:
 *     summary: Generate an AI diagnosis based on workbook submission
 *     description: Analyzes the user's workbook answers and generates a personalized diagnosis
 *     tags:
 *       - Workbook
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - submissionId
 *             properties:
 *               submissionId:
 *                 type: string
 *                 description: ID of the workbook submission to analyze
 *     responses:
 *       200:
 *         description: Diagnosis generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 diagnosis:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                     strengths:
 *                       type: array
 *                       items:
 *                         type: string
 *                     challenges:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     followupWorksheets:
 *                       type: object
 *                       properties:
 *                         pillars:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: IDs of recommended pillar worksheets
 *                         followup:
 *                           type: string
 *                           description: ID of the recommended follow-up worksheet
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
 *       404:
 *         description: Not found - Submission not found
 *       500:
 *         description: Server error
 */

/**
 * POST handler for generating an AI diagnosis
 * Analyzes the workbook submission and generates a personalized diagnosis
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has an active subscription
    await connectToDatabase();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has an active subscription
    const validStatuses = ['active', 'past_due'];
    if (!user.subscription || !validStatuses.includes(user.subscription.status)) {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { submissionId } = body;

    // Validate required fields
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing required field: submissionId' },
        { status: 400 }
      );
    }

    // Find the submission
    const submission = await WorkbookSubmission.findOne({
      _id: submissionId,
      userId: session.user.id,
      status: 'submitted'
    }).exec();

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found or not submitted' },
        { status: 404 }
      );
    }

    // Load the workbook structure
    const workbook = await loadWorkbook();
    if (!workbook) {
      return NextResponse.json(
        { error: 'Failed to load workbook structure' },
        { status: 500 }
      );
    }

    // Format answers with question text
    const formattedAnswers: FormattedQA[] = [];
    for (const [questionId, answer] of Object.entries(submission.answers)) {
      // Find the question in the workbook structure
      const section = workbook.sections.find((s: any) => 
        s.questions.some((q: any) => q.id === questionId)
      );
      
      if (section) {
        const question = section.questions.find((q: any) => q.id === questionId);
        if (question && answer) {
          formattedAnswers.push({
            question: question.text,
            answer: answer as string
          });
        }
      }
    }

    try {
      // Generate the AI diagnosis using our utility function
      const diagnosis = await generateAIDiagnosis(formattedAnswers, user.name || 'Client');
      
      // Determine the most appropriate follow-up worksheets
      const followupWorksheets = determineFollowupWorksheets(diagnosis);
      
      // Save the diagnosis to the submission
      submission.diagnosis = {
        summary: diagnosis.summary,
        strengths: diagnosis.strengths,
        challenges: diagnosis.challenges,
        recommendations: diagnosis.recommendations,
        followupWorksheets
      };
      submission.diagnosisGeneratedAt = new Date();
      await submission.save();

      return NextResponse.json({
        success: true,
        diagnosis
      }, { status: 200 });
    } catch (error) {
      console.error('Error generating AI diagnosis:', error);
      return NextResponse.json(
        { error: 'Failed to generate diagnosis' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing diagnosis request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




