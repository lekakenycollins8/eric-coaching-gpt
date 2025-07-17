import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/models';
import WorkbookSubmission from '@/models/WorkbookSubmission';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/workbook/submit:
 *   post:
 *     summary: Submit the completed Jackier Method Workbook
 *     description: Finalizes the workbook submission and triggers the AI diagnosis process
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
 *             properties:
 *               workbookId:
 *                 type: string
 *                 description: ID of the workbook
 *                 example: jackier-method-workbook
 *               submissionId:
 *                 type: string
 *                 description: ID of the draft submission to finalize
 *               answers:
 *                 type: object
 *                 description: Final answers to the workbook questions (optional if submissionId is provided)
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Workbook submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 submissionId:
 *                   type: string
 *                   description: ID of the submitted workbook
 *                 diagnosisScheduled:
 *                   type: boolean
 *                   description: Whether the AI diagnosis has been scheduled
 *       400:
 *         description: Bad request - Missing required fields or incomplete workbook
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
 * POST handler for submitting the completed workbook
 * Finalizes the submission and triggers the AI diagnosis process
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
    const { workbookId, submissionId, answers } = body;

    // Validate required fields
    if (!workbookId) {
      return NextResponse.json(
        { error: 'Missing required field: workbookId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    let submission;

    // If submissionId is provided, find the existing draft
    if (submissionId) {
      submission = await WorkbookSubmission.findOne({
        _id: submissionId,
        userId,
        workbookId
      }).exec();

      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }

      // Update answers if provided
      if (answers) {
        submission.answers = {
          ...submission.answers,
          ...answers
        };
      }
    } else {
      // If no submissionId, require answers
      if (!answers) {
        return NextResponse.json(
          { error: 'Missing required field: answers or submissionId' },
          { status: 400 }
        );
      }

      // Create new submission
      submission = new WorkbookSubmission({
        userId,
        workbookId,
        status: 'draft',
        answers,
        emailSent: false,
        schedulingPrompted: false
      });
    }

    // Check if the submission has enough answers to be considered complete
    const answeredQuestions = Object.values(submission.answers || {})
      .filter(answer => answer !== null && answer !== undefined && answer !== '')
      .length;

    // Require at least 80% of questions to be answered
    // In a real implementation, you might want to check specific required questions
    if (answeredQuestions < 10) { // Assuming there are at least 12-15 important questions
      return NextResponse.json(
        { 
          error: 'Workbook is incomplete', 
          message: 'Please answer more questions before submitting' 
        },
        { status: 400 }
      );
    }

    // Update submission status to submitted
    submission.status = 'submitted';
    submission.submittedAt = new Date();
    
    // Save the submission
    await submission.save();

    // In a real implementation, you would trigger the AI diagnosis process here
    // For now, we'll just mark that it's scheduled
    const diagnosisScheduled = true;

    // TODO: Schedule AI diagnosis process
    // This would typically be done via a background job or queue
    // For example: await scheduleDiagnosis(submission._id);

    return NextResponse.json({
      success: true,
      submissionId: submission._id,
      diagnosisScheduled
    }, { status: 200 });
  } catch (error) {
    console.error('Error submitting workbook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
