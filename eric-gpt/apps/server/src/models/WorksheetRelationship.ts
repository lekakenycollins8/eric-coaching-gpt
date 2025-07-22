import mongoose, { Document, Schema } from 'mongoose';

/**
 * Relationship types between worksheets
 */
export enum RelationshipType {
  FOLLOW_UP = 'follow-up',         // A worksheet that builds upon another
  PREREQUISITE = 'prerequisite',   // A worksheet that must be completed before another
  RECOMMENDED = 'recommended',     // A worksheet recommended based on responses
  RELATED = 'related',             // A worksheet that covers related topics
  JACKIER_METHOD = 'jackier-method' // Specifically for Jackier Method to pillar relationships
}

/**
 * Trigger conditions for when to suggest a relationship
 */
export enum TriggerCondition {
  COMPLETION = 'completion',       // Triggered on worksheet completion
  SCORE_THRESHOLD = 'score-threshold', // Triggered when score meets threshold
  TIME_ELAPSED = 'time-elapsed',   // Triggered after specific time period
  SPECIFIC_ANSWER = 'specific-answer', // Triggered by specific answer to a question
  AI_RECOMMENDATION = 'ai-recommendation' // Triggered by AI analysis of responses
}

/**
 * Interface for worksheet relationship
 */
export interface IWorksheetRelationship extends Document {
  sourceWorksheetId: string;       // ID of the source worksheet
  targetWorksheetId: string;       // ID of the target worksheet
  relationshipType: RelationshipType; // Type of relationship
  triggerConditions: {             // Conditions that trigger this relationship
    type: TriggerCondition;
    parameters: Record<string, any>; // Flexible parameters based on trigger type
  }[];
  relevanceScore: number;          // 1-100 score for how relevant the target is to source
  contextDescription: string;      // Human-readable explanation of the relationship
  displayOrder: number;            // Order to display in recommendations
  active: boolean;                 // Whether this relationship is currently active
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for worksheet relationship
 */
const WorksheetRelationshipSchema = new Schema<IWorksheetRelationship>(
  {
    sourceWorksheetId: {
      type: String,
      required: true,
      index: true
    },
    targetWorksheetId: {
      type: String,
      required: true,
      index: true
    },
    relationshipType: {
      type: String,
      enum: Object.values(RelationshipType),
      required: true
    },
    triggerConditions: [{
      type: {
        type: String,
        enum: Object.values(TriggerCondition),
        required: true
      },
      parameters: {
        type: Schema.Types.Mixed,
        default: {}
      }
    }],
    relevanceScore: {
      type: Number,
      min: 1,
      max: 100,
      default: 50
    },
    contextDescription: {
      type: String,
      required: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for faster lookups
WorksheetRelationshipSchema.index({ sourceWorksheetId: 1, targetWorksheetId: 1 }, { unique: true });

// Create and export the model
export const WorksheetRelationshipModel = mongoose.models.WorksheetRelationship || 
  mongoose.model<IWorksheetRelationship>('WorksheetRelationship', WorksheetRelationshipSchema);

export default WorksheetRelationshipModel;
