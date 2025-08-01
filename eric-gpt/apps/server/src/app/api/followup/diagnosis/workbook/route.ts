import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import FollowupAssessment from '@/models/FollowupAssessment';

/**
 * GET handler for fetching workbook follow-up diagnosis data
 * @param request The request object
 * @returns The workbook follow-up diagnosis data
 */
export async function GET(request: Request) {
  try {
    // Get user ID either from session or custom header
    const session = await getServerSession(authOptions);
    const headerUserId = request.headers.get('X-User-Id');
    
    // Use either session user ID or header user ID
    const userId = session?.user?.id || headerUserId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Connect to the database
    await connectToDatabase();
    
    console.log(`Fetching workbook diagnosis for user ID: ${userId}`);
    
    // Find the most recent workbook follow-up submission for this user
    // First try to find by explicit followupType
    let submission = await FollowupAssessment.findOne({
      userId: userId,
      followupType: 'workbook'
    }).sort({ createdAt: -1 }); // Get the most recent submission
    
    // If not found, try the legacy approach (checking if followupId doesn't include 'pillar')
    if (!submission) {
      console.log('No submission found with explicit workbook type, trying legacy approach');
      submission = await FollowupAssessment.findOne({
        userId: userId,
        followupId: { $not: /pillar/i } // Regex to exclude pillar follow-ups
      }).sort({ createdAt: -1 });
    }
    
    if (!submission) {
      console.log(`No workbook submission found for user ID: ${userId}`);
      return NextResponse.json({ error: 'Workbook follow-up submission not found' }, { status: 404 });
    }
    
    console.log(`Found workbook submission: ${submission._id}`);
    
    // Extract and return the diagnosis data
    const diagnosisData = {
      id: submission._id,
      title: submission.title || 'Workbook Implementation Follow-up',
      diagnosis: submission.diagnosis || null,
      recommendations: submission.recommendations || [],
      completedAt: submission.createdAt,
      followupType: 'workbook',
      // Include additional data if available
      progressData: submission.progressData || null,
    };
    
    return NextResponse.json(diagnosisData);
  } catch (error) {
    console.error('Error fetching workbook follow-up diagnosis:', error);
    return NextResponse.json({ error: 'Failed to fetch workbook follow-up diagnosis' }, { status: 500 });
  }
}
