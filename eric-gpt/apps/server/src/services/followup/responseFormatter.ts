import { NextResponse } from 'next/server';

/**
 * Formats a success response for the follow-up submission
 */
export function formatSuccessResponse(followupAssessment: any, followupType: string) {
  return NextResponse.json({
    success: true,
    followupId: followupAssessment ? followupAssessment._id.toString() : null,
    followupType,
    originalSubmissionUpdated: true
  }, { status: 200 });
}

/**
 * Formats an error response for the follow-up submission
 */
export function formatErrorResponse(error: any, status: number = 500) {
  console.error('Error submitting follow-up worksheet:', error);
  return NextResponse.json(
    { error: error.message || 'Internal server error' },
    { status }
  );
}
