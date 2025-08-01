/**
 * API endpoint to fetch the most recent follow-up submission for a user
 * Used to determine the appropriate diagnosis page to show
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { FollowupAssessment } from '@/models/FollowupAssessment';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * GET handler to retrieve the most recent follow-up submission
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from session, header, or query parameter
    let userId;
    
    // First try to get userId from the session
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // If no session, try to get userId from custom header (for production cross-domain requests)
      const headerUserId = request.headers.get('X-User-Id');
      if (headerUserId) {
        userId = headerUserId;
      } else {
        // Finally, try to get userId from query parameters (backward compatibility)
        const { searchParams } = new URL(request.url);
        userId = searchParams.get('userId');
        
        if (!userId) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
      }
    }

    // Connect to the database
    await connectToDatabase();
    
    // Convert string ID to MongoDB ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find the most recent follow-up submission for this user
    const recentSubmission = await FollowupAssessment.findOne(
      { userId: userObjectId, status: 'completed' },
      { 
        followupId: 1, 
        followupType: 1, 
        createdAt: 1, 
        completedAt: 1,
        _id: 1,
        diagnosis: 1,
        metadata: 1
      }
    ).sort({ createdAt: -1 }).limit(1);

    // Format the response
    const formattedSubmission = recentSubmission ? {
      id: recentSubmission._id.toString(),
      followupId: recentSubmission.followupId,
      followupType: recentSubmission.followupType,
      createdAt: recentSubmission.createdAt,
      completedAt: recentSubmission.completedAt,
      // Include a summary of the diagnosis data for the frontend
      diagnosisSummary: recentSubmission.diagnosis ? {
        summary: recentSubmission.diagnosis.summary || '',
        hasDetailedDiagnosis: !!(
          recentSubmission.diagnosis.situationAnalysis || 
          recentSubmission.diagnosis.strengthsAnalysis || 
          recentSubmission.diagnosis.growthAreasAnalysis
        )
      } : null,
      metadata: recentSubmission.metadata || null
    } : null;

    // Return the submission data
    return NextResponse.json({
      success: true,
      submission: formattedSubmission
    });
  } catch (error) {
    console.error('Error fetching recent follow-up submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
