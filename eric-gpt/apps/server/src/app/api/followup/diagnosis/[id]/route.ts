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
  { params }: { params: Promise<{ id: string }> }
) {
  // Extract followupId outside try/catch to make it available in catch block
  const { id: followupId } = await params;
  
  try {
    
    if (!followupId) {
      return NextResponse.json({ error: 'Follow-up ID is required' }, { status: 400 });
    }
    
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
    
    console.log(`Fetching diagnosis for follow-up ID: ${followupId} and user ID: ${userId}`);
    
    // Determine if this is a pillar follow-up
    const isPillar = followupId.includes('pillar') || /^(pillar-\d+|p\d+|[a-z]+-pillar)/.test(followupId);
    
    // Find the follow-up submission for this user and follow-up ID
    let submission = await FollowupAssessment.findOne({
      followupId: followupId,
      userId: userId,
    }).sort({ createdAt: -1 }); // Get the most recent submission
    
    // If not found and it's a pillar, try to find by followupType
    if (!submission && isPillar) {
      console.log(`No direct match found, trying to find by followupType='pillar' and pillar ID`);
      submission = await FollowupAssessment.findOne({
        userId: userId,
        followupType: 'pillar',
        pillarId: followupId.replace(/^pillar-/, '') // Extract pillar number if present
      }).sort({ createdAt: -1 });
    }
    
    if (!submission) {
      console.log(`No submission found for follow-up ID: ${followupId} and user ID: ${userId}`);
      return NextResponse.json({ error: 'Follow-up submission not found' }, { status: 404 });
    }
    
    console.log(`Found submission: ${submission._id}`);
    
    // Extract and return the diagnosis data
    // Process the diagnosis data to ensure it's properly structured for the frontend
    let processedDiagnosis = null;
    let processedRecommendations = submission.recommendations || [];
    
    // Check if we have diagnosis data in the submission
    if (submission.diagnosis) {
      console.log('Found diagnosis data, structuring for frontend display');
      
      // Define the diagnosis object type with all possible fields
      interface EnhancedDiagnosis {
        summary: string;
        situationAnalysis: {
          fullText: string;
        };
        strengths: string[];
        challenges: string[];
        actionableRecommendations: string[];
        progressAnalysis?: string;
        implementationEffectiveness?: string;
        adjustedRecommendations?: string;
        continuedGrowthPlan?: string;
        implementationProgressAnalysis?: string;
        crossPillarIntegration?: string;
        implementationBarriers?: string;
        comprehensiveAdjustmentPlan?: string;
        nextFocusAreas?: string;
        coachingSupportAssessment?: string;
      }
      
      // Create a structured diagnosis object from the database diagnosis data
      processedDiagnosis = {
        summary: submission.diagnosis.summary || '',
        situationAnalysis: {
          // Ensure situationAnalysis.fullText is always populated with a valid string
          fullText: typeof submission.diagnosis.situationAnalysis === 'object' && submission.diagnosis.situationAnalysis?.fullText ? 
                    submission.diagnosis.situationAnalysis.fullText : 
                    (typeof submission.diagnosis.situationAnalysis === 'string' ? submission.diagnosis.situationAnalysis : '')
        },
        strengths: Array.isArray(submission.diagnosis.strengths) ? 
                  submission.diagnosis.strengths : 
                  [submission.diagnosis.strengthsAnalysis || ''],
        challenges: Array.isArray(submission.diagnosis.challenges) ? 
                   submission.diagnosis.challenges : 
                   [submission.diagnosis.growthAreasAnalysis || ''],
        actionableRecommendations: Array.isArray(submission.diagnosis.recommendations) ? 
                                  submission.diagnosis.recommendations : 
                                  [submission.diagnosis.actionableRecommendations || '']
      } as EnhancedDiagnosis;
      
      // Add follow-up type specific fields
      if (submission.followupType === 'pillar') {
        // For pillar follow-ups, ensure all required fields are properly populated
        processedDiagnosis.progressAnalysis = typeof submission.diagnosis.situationAnalysis === 'object' && submission.diagnosis.situationAnalysis?.fullText ? 
                                             submission.diagnosis.situationAnalysis.fullText : 
                                             (typeof submission.diagnosis.situationAnalysis === 'string' ? submission.diagnosis.situationAnalysis : '');
        processedDiagnosis.implementationEffectiveness = submission.diagnosis.strengthsAnalysis || '';
        // Format adjustedRecommendations properly to avoid formatting issues
        if (typeof submission.diagnosis.growthAreasAnalysis === 'string') {
          processedDiagnosis.adjustedRecommendations = submission.diagnosis.growthAreasAnalysis;
        } else if (Array.isArray(submission.diagnosis.growthAreasAnalysis)) {
          // If it's an array of objects, format them properly
          if (submission.diagnosis.growthAreasAnalysis.length > 0 && 
              typeof submission.diagnosis.growthAreasAnalysis[0] === 'object') {
            // Format each object in the array into a readable string with bullet points
            const formattedRecs = submission.diagnosis.growthAreasAnalysis.map((item: any, index: number) => {
              if (item.area) {
                return item.area;
              }
              return JSON.stringify(item);
            });
            processedDiagnosis.adjustedRecommendations = formattedRecs.join('\n\n');
          } else {
            // Simple array of strings
            processedDiagnosis.adjustedRecommendations = submission.diagnosis.growthAreasAnalysis.join('\n\n');
          }
        } else if (typeof submission.diagnosis.growthAreasAnalysis === 'object') {
          // Handle single object case
          const item = submission.diagnosis.growthAreasAnalysis;
          processedDiagnosis.adjustedRecommendations = item.area || JSON.stringify(item);
        } else {
          processedDiagnosis.adjustedRecommendations = '';
        }
        // Format continuedGrowthPlan properly to avoid [object Object] display
        if (typeof submission.diagnosis.actionableRecommendations === 'string') {
          processedDiagnosis.continuedGrowthPlan = submission.diagnosis.actionableRecommendations;
        } else if (Array.isArray(submission.diagnosis.actionableRecommendations)) {
          // If it's an array of objects, format them properly
          if (submission.diagnosis.actionableRecommendations.length > 0 && 
              typeof submission.diagnosis.actionableRecommendations[0] === 'object') {
            // Format each object in the array into a readable string
            const formattedPlans = submission.diagnosis.actionableRecommendations.map((item: any) => {
              if (item.action) {
                return `- ${item.action}`;
              }
              return JSON.stringify(item);
            });
            processedDiagnosis.continuedGrowthPlan = formattedPlans.join('\n');
          } else {
            // Simple array of strings
            processedDiagnosis.continuedGrowthPlan = submission.diagnosis.actionableRecommendations.join('\n');
          }
        } else if (typeof submission.diagnosis.actionableRecommendations === 'object') {
          // Handle single object case
          const item = submission.diagnosis.actionableRecommendations;
          processedDiagnosis.continuedGrowthPlan = item.action || JSON.stringify(item);
        } else {
          processedDiagnosis.continuedGrowthPlan = '';
        }
      } else {
        processedDiagnosis.implementationProgressAnalysis = submission.diagnosis.situationAnalysis?.fullText || 
                                                          submission.diagnosis.situationAnalysis || '';
        processedDiagnosis.crossPillarIntegration = submission.diagnosis.strengthsAnalysis || '';
        processedDiagnosis.implementationBarriers = submission.diagnosis.growthAreasAnalysis || '';
        processedDiagnosis.comprehensiveAdjustmentPlan = submission.diagnosis.actionableRecommendations || '';
        processedDiagnosis.nextFocusAreas = submission.diagnosis.pillarRecommendations || '';
      }
      
      // Add coaching support assessment
      processedDiagnosis.coachingSupportAssessment = submission.diagnosis.followupRecommendation || '';
      // Safely access emailContent properties with null/undefined checks
      if (submission.emailContent && submission.emailContent.implementationEffectiveness) {
        const impl = submission.emailContent.implementationEffectiveness;
        processedDiagnosis.summary = impl.strength || '';
        
        // Add evidence, impact, and leverage if available
        if (impl.evidence) processedDiagnosis.strengths.push(impl.evidence);
        if (impl.impact) processedDiagnosis.challenges.push(impl.impact);
        if (impl.leverage) processedDiagnosis.actionableRecommendations.push(impl.leverage);
      }
      
      // Extract progress analysis
      // Safely check all nested properties
      if (submission.emailContent && 
          submission.emailContent.progressAnalysis && 
          submission.emailContent.progressAnalysis.fullText) {
        processedDiagnosis.situationAnalysis = {
          fullText: submission.emailContent.progressAnalysis.fullText
        };
      }
      
      // Extract adjusted recommendations - safely check emailContent
      if (submission.emailContent && submission.emailContent.adjustedRecommendations) {
        const rec = submission.emailContent.adjustedRecommendations;
        if (rec.area) {
          processedRecommendations.push({
            action: rec.area,
            evidence: rec.evidence || '',
            impact: rec.impact || '',
            rootCause: rec.rootCause || ''
          });
        }
      }
      
      // Extract continued growth plan - with additional null checks
      if (submission.emailContent && submission.emailContent.continuedGrowthPlan) {
        const plan = submission.emailContent.continuedGrowthPlan;
        if (plan && plan.action) {
          processedRecommendations.push({
            action: plan.action,
            implementation: plan.implementation || '',
            outcome: plan.outcome || '',
            measurement: plan.measurement || ''
          });
        }
      }
      
      // If we still don't have any recommendations, add a default one to prevent empty arrays
      if (processedRecommendations.length === 0) {
        processedRecommendations.push({
          action: 'Continue working on your development areas',
          implementation: '',
          outcome: '',
          measurement: ''
        });
      }
    }
    
    const diagnosisData = {
      id: submission._id,
      title: submission.title || `Follow-up for ${followupId}`,
      diagnosis: processedDiagnosis || null,
      recommendations: processedRecommendations,
      completedAt: submission.createdAt,
      followupType: submission.followupType || (followupId.includes('pillar') ? 'pillar' : 'workbook'),
      progressData: submission.progressData || null,
      metadata: submission.metadata || null
    };
    
    return NextResponse.json(diagnosisData);
  } catch (error) {
    console.error(`Error fetching follow-up diagnosis for ID ${followupId}:`, error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Failed to fetch follow-up diagnosis' }, { status: 500 });
  }
}
