import { connectToDatabase } from '../db/connection';
import WorksheetRelationshipModel, { 
  IWorksheetRelationship, 
  RelationshipType, 
  TriggerCondition 
} from '../models/WorksheetRelationship';
import { loadWorksheetById } from '../utils/worksheetLoader';

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
  }[]> {
    await connectToDatabase();
    
    // Get all relationships where this worksheet is the source
    const relationships = await this.getRelationshipsFromSource(worksheetId);
    
    // Filter relationships based on trigger conditions
    const validRelationships = relationships.filter(relationship => {
      // For now, we'll consider all relationships valid
      // In the future, we can implement more complex filtering based on
      // trigger conditions, user answers, and user profile
      return true;
    });
    
    // Load the target worksheets for valid relationships
    const recommendations = await Promise.all(
      validRelationships.map(async (relationship) => {
        const targetWorksheet = await loadWorksheetById(relationship.targetWorksheetId);
        
        if (!targetWorksheet) {
          return null;
        }
        
        return {
          worksheetId: targetWorksheet.id,
          title: targetWorksheet.title,
          description: targetWorksheet.description,
          relevanceScore: relationship.relevanceScore,
          contextDescription: relationship.contextDescription,
          relationshipType: relationship.relationshipType
        };
      })
    );
    
    // Define the return type to avoid null values
    type RecommendationType = {
      worksheetId: string;
      title: string;
      description: string;
      relevanceScore: number;
      contextDescription: string;
      relationshipType: RelationshipType;
    };
    
    // Filter out null values and sort by relevance score
    return recommendations
      .filter((rec): rec is RecommendationType => rec !== null)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
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
