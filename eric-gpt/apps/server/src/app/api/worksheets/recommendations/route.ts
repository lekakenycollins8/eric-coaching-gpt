import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import worksheetRelationshipService from '@/services/worksheetRelationshipService';
import { hasFeatureAccess } from '@/utils/subscription';
import { getUserByEmail, IUser } from '@/models/User';
// Import submission service using relative path
import * as submissionService from '@/services/submissionService';
const { getSubmissionsByUserId } = submissionService;

/**
 * @swagger
 * /api/worksheets/recommendations:
 *   get:
 *     summary: Get worksheet recommendations
 *     description: Retrieves personalized worksheet recommendations based on completed worksheets
 *     parameters:
 *       - name: worksheetId
 *         in: query
 *         required: false
 *         description: If provided, returns recommendations specific to this worksheet
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Maximum number of recommendations to return
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: List of recommended worksheets
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - subscription required
 */
export async function GET(request: NextRequest) {
  try {
    let userEmail: string | null = null;
    
    // First try to get the session from NextAuth
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      userEmail = session.user.email;
    } else {
      // If no session, check for authorization header
      const authHeader = request.headers.get('Authorization');
      const userIdHeader = request.headers.get('x-user-id');
      const userEmailHeader = request.headers.get('x-user-email');
      
      if (userEmailHeader) {
        userEmail = userEmailHeader;
        console.log('Using email from x-user-email header:', userEmail);
      } else if (authHeader && userIdHeader) {
        // We have a user ID but no email, we could look up the user by ID here
        // This is a fallback approach
        console.log('Got auth header and user ID header, but no email header');
      } else {
        console.log('No valid authentication found in request');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }

    // Connect to the database
    await connectToDatabase();
    
    // Get the user
    if (!userEmail) {
      console.log('No email available to look up user');
      return NextResponse.json({ error: 'Authentication required - valid email needed' }, { status: 401 });
    }
    
    const user = await getUserByEmail(userEmail) as IUser;
    if (!user) {
      console.log('User not found with email:', userEmail);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to worksheets
    const hasAccess = await hasFeatureAccess(user, 'worksheets');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Subscription required for worksheet access' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const worksheetId = searchParams.get('worksheetId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    let recommendations = [];

    // If worksheetId is provided, get recommendations for that specific worksheet
    if (worksheetId) {
      // Get user submissions
      const userId = user && user._id ? (typeof user._id === 'string' ? user._id : user._id.toString()) : '';
      const submissions = await getSubmissionsByUserId(userId);
      
      // Define the submission type to avoid TypeScript errors
      interface Submission {
        status: string;
        worksheetId: string;
        answers?: Record<string, any>;
        [key: string]: any; // Allow other properties
      }
      
      // Cast submissions to the appropriate type
      const typedSubmissions = submissions as unknown as Submission[];
      
      // Extract completed worksheet IDs
      const completedWorksheetIds = typedSubmissions.map(sub => sub.worksheetId);

      // Get the user's submission for this worksheet if it exists
      const submission = typedSubmissions.find(sub => sub.worksheetId === worksheetId);
      
      // Get recommendations based on the worksheet and user's answers
      recommendations = await worksheetRelationshipService.getRecommendedFollowUps(
        worksheetId,
        submission?.answers || {},
        { user }
      );
    } else {
      // Get user submissions
      const userId = user && user._id ? (typeof user._id === 'string' ? user._id : user._id.toString()) : '';
      const submissions = await getSubmissionsByUserId(userId);
      
      // Define the submission type to avoid TypeScript errors
      interface Submission {
        status: string;
        worksheetId: string;
        answers?: Record<string, any>;
        [key: string]: any; // Allow other properties
      }
      
      // Process submissions to extract answers
      const userAnswers = (submissions as unknown as Submission[]).reduce((acc: Record<string, any>, submission: Submission) => {
        // Only include completed submissions
        if (submission.status === 'completed') {
          // Extract answers from the submission
          const answers = submission.answers || {};
          
          // Add to the accumulated answers
          acc[submission.worksheetId] = answers;
        }
        return acc;
      }, {});

      // Get recommendations for each completed worksheet
      const allRecommendations = await Promise.all(
        Object.keys(userAnswers).map(async (worksheetId) => {
          const recs = await worksheetRelationshipService.getRecommendedFollowUps(
            worksheetId,
            userAnswers[worksheetId],
            { user }
          );
          return recs;
        })
      );

      // Flatten the array of recommendations
      const flattenedRecommendations = allRecommendations.flat();

      // Define recommendation type
      interface WorksheetRecommendation {
        worksheetId: string;
        title: string;
        description: string;
        relevanceScore: number;
        contextDescription: string;
        relationshipType: string;
      }

      // Remove duplicates based on worksheetId
      const uniqueWorksheetIds = new Set<string>();
      recommendations = flattenedRecommendations.filter((rec: WorksheetRecommendation) => {
        if (uniqueWorksheetIds.has(rec.worksheetId)) {
          return false;
        }
        uniqueWorksheetIds.add(rec.worksheetId);
        return true;
      });
      
      // Sort by relevance score (highest first)
      recommendations.sort((a: WorksheetRecommendation, b: WorksheetRecommendation) => 
        b.relevanceScore - a.relevanceScore
      );
      
      // Find the current worksheet in the recommendations (if any)
      if (worksheetId) {
        const currentWorksheetIndex = recommendations.findIndex(
          (rec: WorksheetRecommendation) => rec.worksheetId === worksheetId
        );
        
        // If the current worksheet is in the recommendations, remove it
        if (currentWorksheetIndex !== -1) {
          recommendations.splice(currentWorksheetIndex, 1);
        }
      }
    }
    
    // Limit results
    const limitedRecommendations = recommendations.slice(0, limit);

    return NextResponse.json({ recommendations: limitedRecommendations });
  } catch (error) {
    console.error('Error retrieving worksheet recommendations:', error);
    return NextResponse.json({ error: 'Failed to retrieve worksheet recommendations' }, { status: 500 });
  }
}
