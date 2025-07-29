import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import FollowupAssessment from '@/models/FollowupAssessment';

/**
 * GET handler for fetching follow-up diagnosis data
 * @param request The request object
 * @param params The route parameters containing the follow-up ID
 * @returns The follow-up diagnosis data
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the follow-up ID from the route params
    const followupId = params.id;
    
    if (!followupId) {
      return NextResponse.json({ error: 'Follow-up ID is required' }, { status: 400 });
    }
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    console.log(`Fetching diagnosis for follow-up ID: ${followupId} and user ID: ${session.user.id}`);
    
    // Determine if this is a pillar follow-up
    const isPillar = followupId.includes('pillar') || /^(pillar-\d+|p\d+|[a-z]+-pillar)/.test(followupId);
    
    // Find the follow-up submission for this user and follow-up ID
    let submission = await FollowupAssessment.findOne({
      followupId: followupId,
      userId: session.user.id,
    }).sort({ createdAt: -1 }); // Get the most recent submission
    
    // If not found and it's a pillar, try to find by followupType
    if (!submission && isPillar) {
      console.log(`No direct match found, trying to find by followupType='pillar' and pillar ID`);
      submission = await FollowupAssessment.findOne({
        userId: session.user.id,
        followupType: 'pillar',
        pillarId: followupId.replace(/^pillar-/, '') // Extract pillar number if present
      }).sort({ createdAt: -1 });
    }
    
    if (!submission) {
      console.log(`No submission found for follow-up ID: ${followupId} and user ID: ${session.user.id}`);
      return NextResponse.json({ error: 'Follow-up submission not found' }, { status: 404 });
    }
    
    console.log(`Found submission: ${submission._id}`);
    
    // Extract and return the diagnosis data
    const diagnosisData = {
      id: submission._id,
      title: submission.title || `Follow-up for ${followupId}`,
      diagnosis: submission.diagnosis || null,
      recommendations: submission.recommendations || [],
      completedAt: submission.createdAt,
      followupType: followupId.includes('pillar') ? 'pillar' : 'workbook',
      // Include additional data if available
      progressData: submission.progressData || null,
    };
    
    return NextResponse.json(diagnosisData);
  } catch (error) {
    console.error('Error fetching follow-up diagnosis:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-up diagnosis' }, { status: 500 });
  }
}
