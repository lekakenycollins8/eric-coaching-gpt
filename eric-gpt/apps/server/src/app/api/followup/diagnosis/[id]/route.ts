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
    const followupId = await params.id;
    
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
          fullText: submission.diagnosis.situationAnalysis?.fullText || 
                    submission.diagnosis.situationAnalysis || 
                    ''
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
        processedDiagnosis.progressAnalysis = submission.diagnosis.situationAnalysis?.fullText || 
                                             submission.diagnosis.situationAnalysis || '';
        processedDiagnosis.implementationEffectiveness = submission.diagnosis.strengthsAnalysis || '';
        processedDiagnosis.adjustedRecommendations = submission.diagnosis.growthAreasAnalysis || '';
        processedDiagnosis.continuedGrowthPlan = submission.diagnosis.actionableRecommendations || '';
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
      if (submission.emailContent.implementationEffectiveness) {
        const impl = submission.emailContent.implementationEffectiveness;
        processedDiagnosis.summary = impl.strength || '';
        
        // Add evidence, impact, and leverage if available
        if (impl.evidence) processedDiagnosis.strengths.push(impl.evidence);
        if (impl.impact) processedDiagnosis.challenges.push(impl.impact);
        if (impl.leverage) processedDiagnosis.actionableRecommendations.push(impl.leverage);
      }
      
      // Extract progress analysis
      if (submission.emailContent.progressAnalysis && submission.emailContent.progressAnalysis.fullText) {
        processedDiagnosis.situationAnalysis = {
          fullText: submission.emailContent.progressAnalysis.fullText
        };
      }
      
      // Extract adjusted recommendations
      if (submission.emailContent.adjustedRecommendations) {
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
      
      // Extract continued growth plan
      if (submission.emailContent.continuedGrowthPlan) {
        const plan = submission.emailContent.continuedGrowthPlan;
        if (plan.action) {
          processedRecommendations.push({
            action: plan.action,
            implementation: plan.implementation || '',
            outcome: plan.outcome || '',
            measurement: plan.measurement || ''
          });
        }
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
    console.error('Error fetching follow-up diagnosis:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-up diagnosis' }, { status: 500 });
  }
}
