import { connectToDatabase } from '../db/connection';
import WorksheetRelationshipModel, { 
  IWorksheetRelationship, 
  RelationshipType, 
  TriggerCondition 
} from '../models/WorksheetRelationship';
import { loadWorksheetById } from '../utils/worksheetLoader';
import { analyzeUserChallenges } from '@/utils/aiAnalysis'
import { IUser } from '../models/User';

/**
 * Service for managing worksheet relationships
 */
export class WorksheetRelationshipService {
  /**
   * Create a new relationship between worksheets
   */
  async createRelationship(relationshipData: Partial<IWorksheetRelationship>): Promise<IWorksheetRelationship> {
    await connectToDatabase();
    
    // Validate that both source and target worksheets exist
    const sourceWorksheet = await loadWorksheetById(relationshipData.sourceWorksheetId as string);
    const targetWorksheet = await loadWorksheetById(relationshipData.targetWorksheetId as string);
    
    if (!sourceWorksheet) {
      throw new Error(`Source worksheet ${relationshipData.sourceWorksheetId} not found`);
    }
    
    if (!targetWorksheet) {
      throw new Error(`Target worksheet ${relationshipData.targetWorksheetId} not found`);
    }
    
    // Create the relationship
    const relationship = new WorksheetRelationshipModel(relationshipData);
    return await relationship.save();
  }
  
  /**
   * Get all relationships where the specified worksheet is the source
   */
  async getRelationshipsFromSource(worksheetId: string): Promise<IWorksheetRelationship[]> {
    await connectToDatabase();
    return WorksheetRelationshipModel.find({ 
      sourceWorksheetId: worksheetId,
      active: true
    }).sort({ displayOrder: 1 }).exec();
  }
  
  /**
   * Get all relationships where the specified worksheet is the target
   */
  async getRelationshipsToTarget(worksheetId: string): Promise<IWorksheetRelationship[]> {
    await connectToDatabase();
    return WorksheetRelationshipModel.find({ 
      targetWorksheetId: worksheetId,
      active: true
    }).sort({ displayOrder: 1 }).exec();
  }
  
  /**
   * Get recommended follow-up worksheets for a completed worksheet
   * @param worksheetId The ID of the completed worksheet
   * @param userAnswers User's answers to the worksheet questions
   * @param userProfile Additional user profile data for personalization
   */
  async getRecommendedFollowUps(
    worksheetId: string, 
    userAnswers?: Record<string, any>,
    userProfile?: Record<string, any>
  ): Promise<{
    worksheetId: string;
    title: string;
    description: string;
    relevanceScore: number;
    contextDescription: string;
    relationshipType: RelationshipType;
    aiGeneratedContext?: string;
    challengeAreas?: string[];
  }[]> {
    await connectToDatabase();
    
    // Get all relationships where this worksheet is the source
    const relationships = await this.getRelationshipsFromSource(worksheetId);
    
    // Filter relationships based on trigger conditions
    const validRelationships = relationships.filter(relationship => {
      // Check if the relationship has AI_RECOMMENDATION trigger condition
      const hasAiTrigger = relationship.triggerConditions.some(
        condition => condition.type === TriggerCondition.AI_RECOMMENDATION
      );
      
      // If it has AI trigger, we'll validate it later with AI analysis
      // For other trigger types, consider them valid for now
      return true;
    });
    
    // Get user challenges if we have user answers
    let userChallenges: { challenges: string[], analysis: string } | null = null;
    if (userAnswers && Object.keys(userAnswers).length > 0) {
      try {
        // Get the source worksheet to provide context for AI analysis
        const sourceWorksheet = await loadWorksheetById(worksheetId);
        if (sourceWorksheet) {
          // Analyze user challenges based on their answers
          userChallenges = await analyzeUserChallenges(
            sourceWorksheet,
            userAnswers,
            userProfile?.user as IUser
          );
        }
      } catch (error) {
        console.error('Error analyzing user challenges:', error);
        // Continue without AI analysis if it fails
      }
    }
    
    // Load the target worksheets for valid relationships
    const recommendations = await Promise.all(
      validRelationships.map(async (relationship) => {
        const targetWorksheet = await loadWorksheetById(relationship.targetWorksheetId);
        
        if (!targetWorksheet) {
          return null;
        }
        
        // Check if this relationship has AI recommendation trigger
        const hasAiTrigger = relationship.triggerConditions.some(
          condition => condition.type === TriggerCondition.AI_RECOMMENDATION
        );
        
        // Adjust relevance score and provide AI-generated context if we have user challenges
        let aiGeneratedContext: string | undefined;
        let challengeAreas: string[] | undefined;
        let adjustedRelevanceScore = relationship.relevanceScore;
        
        if (hasAiTrigger && userChallenges) {
          // Check if this worksheet addresses any of the user's challenges
          const matchingChallenges = userChallenges.challenges.filter(challenge => 
            targetWorksheet.tags?.some((tag: string | null | undefined) => 
              tag !== null && tag !== undefined && tag.toLowerCase().includes(challenge.toLowerCase())
            )
          );
          
          if (matchingChallenges.length > 0) {
            // Boost relevance score for worksheets that match user challenges
            adjustedRelevanceScore = Math.min(100, relationship.relevanceScore + (matchingChallenges.length * 10));
            
            // Get source worksheet for context generation
            const sourceWorksheet = await loadWorksheetById(worksheetId);
            
            try {
              // Generate personalized context using AI
              if (sourceWorksheet) {
                // Import the generateRecommendationContext function
                const { generateRecommendationContext } = await import('../utils/aiAnalysis');
                
                // Generate personalized context
                aiGeneratedContext = await generateRecommendationContext(
                  sourceWorksheet,
                  targetWorksheet,
                  matchingChallenges
                );
              }
            } catch (error) {
              console.error('Error generating recommendation context:', error);
              // Fallback to simple context if AI generation fails
              aiGeneratedContext = `This worksheet addresses your challenges with ${matchingChallenges.join(', ')} identified in your previous responses.`;
            }
            
            // Set challenge areas for display in UI
            challengeAreas = matchingChallenges;
          }
        }
        
        return {
          worksheetId: targetWorksheet.id,
          title: targetWorksheet.title,
          description: targetWorksheet.description,
          relevanceScore: adjustedRelevanceScore,
          contextDescription: relationship.contextDescription,
          relationshipType: relationship.relationshipType,
          aiGeneratedContext,
          challengeAreas
        };
      })
    );
    
    // Define the return type for recommendations
    type RecommendationType = {
      worksheetId: string;
      title: string;
      description: string;
      relevanceScore: number;
      contextDescription: string;
      relationshipType: RelationshipType;
      aiGeneratedContext?: string;
      challengeAreas?: string[];
    };
    
    // Filter out null values and sort by relevance score
    const filteredRecommendations = recommendations
      .filter((rec): rec is NonNullable<typeof rec> => rec !== null)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      
    // Cast to the expected return type
    return filteredRecommendations as RecommendationType[];
  }
  
  /**
   * Get the prerequisite worksheets for a given worksheet
   */
  async getPrerequisites(worksheetId: string): Promise<string[]> {
    await connectToDatabase();
    
    const relationships = await WorksheetRelationshipModel.find({
      targetWorksheetId: worksheetId,
      relationshipType: RelationshipType.PREREQUISITE,
      active: true
    }).exec();
    
    return relationships.map(rel => rel.sourceWorksheetId);
  }
  
  /**
   * Check if a worksheet has a specific relationship type to another worksheet
   */
  async hasRelationship(
    sourceWorksheetId: string, 
    targetWorksheetId: string, 
    type?: RelationshipType
  ): Promise<boolean> {
    await connectToDatabase();
    
    const query: any = {
      sourceWorksheetId,
      targetWorksheetId,
      active: true
    };
    
    if (type) {
      query.relationshipType = type;
    }
    
    const count = await WorksheetRelationshipModel.countDocuments(query);
    return count > 0;
  }
  
  /**
   * Update an existing relationship
   */
  async updateRelationship(
    id: string,
    updates: Partial<IWorksheetRelationship>
  ): Promise<IWorksheetRelationship | null> {
    await connectToDatabase();
    return WorksheetRelationshipModel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).exec();
  }
  
  /**
   * Delete a relationship
   */
  async deleteRelationship(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await WorksheetRelationshipModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export default new WorksheetRelationshipService();
