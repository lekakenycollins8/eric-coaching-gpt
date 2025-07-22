import { connectToDatabase } from '../db/connection';
import { RelationshipType, TriggerCondition } from '../models/WorksheetRelationship';
import worksheetRelationshipService from '../services/worksheetRelationshipService';
import { loadAllWorksheets } from '../utils/worksheetLoader';
import fs from 'fs';
import path from 'path';

/**
 * Seed script to create initial worksheet relationships
 */
async function seedWorksheetRelationships() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    
    console.log('Loading all worksheets...');
    const worksheets = await loadAllWorksheets();
    
    console.log(`Found ${worksheets.length} worksheets`);
    
    // Load the follow-up worksheets
    const dataDir = path.join(process.cwd(), 'src/data');
    
    // Crystal Clear Leadership follow-ups
    const crystalClearPath = path.join(dataDir, 'crystal-clear-leadership-followup.json');
    const crystalClearData = JSON.parse(fs.readFileSync(crystalClearPath, 'utf8'));
    
    // Implementation Support follow-ups
    const implementationSupportPath = path.join(dataDir, 'implementation-support-followup.json');
    const implementationSupportData = JSON.parse(fs.readFileSync(implementationSupportPath, 'utf8'));
    
    console.log('Creating relationships...');
    
    // Map pillar IDs to their follow-up worksheet IDs
    const pillarToFollowupMap = {
      'pillar-01-leadership-mindset': 'pillar1-followup',
      'pillar-02-goal-setting': 'pillar2-followup',
      'pillar-03-communication-mastery': 'pillar3-followup',
      'pillar-04-time-mastery': 'pillar4-followup',
      'pillar-05-strategic-thinking': 'pillar5-followup',
      'pillar-06-emotional-intelligence': 'pillar6-followup',
      'pillar-07-delegation-empowerment': 'pillar7-followup',
      'pillar-08-change-uncertainty': 'pillar8-followup',
      'pillar-09-conflict-resolution': 'pillar9-followup',
      'pillar-10-high-performance': 'pillar10-followup',
      'pillar-11-decision-making': 'pillar11-followup',
      'pillar-12-execution-results': 'pillar12-followup'
    };
    
    // Map Jackier Method steps to their follow-up worksheet IDs
    const jackierStepToFollowupMap = {
      'jackier-step1': 'jackier-step1-followup',
      'jackier-step2': 'jackier-step2-followup',
      'jackier-step3': 'jackier-step3-followup',
      'jackier-step4': 'jackier-step4-followup',
      'jackier-step5': 'jackier-step5-followup'
    };
    
    // Create relationships between pillars and their follow-ups
    for (const [pillarId, followupId] of Object.entries(pillarToFollowupMap)) {
      // Find the pillar worksheet
      const pillarWorksheet = worksheets.find((w: { id: string }) => 
        w.id.toLowerCase() === pillarId.toLowerCase() ||
        w.id.replace(/-/g, '_').toLowerCase() === pillarId.replace(/-/g, '_').toLowerCase()
      );
      
      // Find the follow-up worksheet in the crystal clear data
      const followupWorksheet = crystalClearData.find((w: { id: string }) => w.id === followupId);
      
      if (pillarWorksheet && followupWorksheet) {
        console.log(`Creating relationship: ${pillarWorksheet.id} -> ${followupWorksheet.id}`);
        
        try {
          await worksheetRelationshipService.createRelationship({
            sourceWorksheetId: pillarWorksheet.id,
            targetWorksheetId: followupWorksheet.id,
            relationshipType: RelationshipType.FOLLOW_UP,
            triggerConditions: [
              {
                type: TriggerCondition.TIME_ELAPSED,
                parameters: { days: 14 } // 2 weeks after completion
              }
            ],
            relevanceScore: 90,
            contextDescription: `This follow-up worksheet helps you reflect on your progress with ${pillarWorksheet.title} and identify areas where you might need additional support.`,
            displayOrder: 1,
            active: true
          });
        } catch (error) {
          console.error(`Error creating relationship for ${pillarWorksheet.id} -> ${followupWorksheet.id}:`, error);
        }
      } else {
        console.warn(`Could not find pillar worksheet ${pillarId} or follow-up worksheet ${followupId}`);
      }
    }
    
    // Create relationships between Jackier Method steps and their follow-ups
    for (const [stepId, followupId] of Object.entries(jackierStepToFollowupMap)) {
      // Find the step worksheet (this would be a placeholder since we don't have actual Jackier Method worksheets)
      const stepWorksheet = worksheets.find(w => 
        w.id.toLowerCase() === stepId.toLowerCase() ||
        w.id.replace(/-/g, '_').toLowerCase() === stepId.replace(/-/g, '_').toLowerCase()
      );
      
      // Find the follow-up worksheet in the implementation support data
      const followupWorksheet = implementationSupportData.find((w: { id: string }) => w.id === followupId);
      
      if (stepWorksheet && followupWorksheet) {
        console.log(`Creating relationship: ${stepWorksheet.id} -> ${followupWorksheet.id}`);
        
        try {
          await worksheetRelationshipService.createRelationship({
            sourceWorksheetId: stepWorksheet.id,
            targetWorksheetId: followupWorksheet.id,
            relationshipType: RelationshipType.FOLLOW_UP,
            triggerConditions: [
              {
                type: TriggerCondition.TIME_ELAPSED,
                parameters: { days: 7 } // 1 week after completion
              }
            ],
            relevanceScore: 95,
            contextDescription: `This follow-up worksheet helps you implement ${stepWorksheet.title} more effectively in your leadership practice.`,
            displayOrder: 1,
            active: true
          });
        } catch (error) {
          console.error(`Error creating relationship for ${stepWorksheet.id} -> ${followupWorksheet.id}:`, error);
        }
      } else {
        console.warn(`Could not find step worksheet ${stepId} or follow-up worksheet ${followupId}`);
      }
    }
    
    // Create relationships between Jackier Method and relevant pillars
    // This is a placeholder - you would define which pillars are most relevant to each Jackier Method step
    const jackierToPillarRecommendations = {
      'jackier-step1': ['pillar-01-leadership-mindset', 'pillar-11-decision-making'],
      'jackier-step2': ['pillar-05-strategic-thinking', 'pillar-09-conflict-resolution'],
      'jackier-step3': ['pillar-02-goal-setting', 'pillar-10-high-performance'],
      'jackier-step4': ['pillar-07-delegation-empowerment', 'pillar-03-communication-mastery'],
      'jackier-step5': ['pillar-12-execution-results', 'pillar-04-time-mastery']
    };
    
    for (const [jackierId, pillarIds] of Object.entries(jackierToPillarRecommendations)) {
      // Find the jackier method step
      const jackierWorksheet = worksheets.find((w: { id: string }) => 
        w.id.toLowerCase() === jackierId.toLowerCase() ||
        w.id.replace(/-/g, '_').toLowerCase() === jackierId.replace(/-/g, '_').toLowerCase()
      );
      
      if (jackierWorksheet) {
        for (const pillarId of pillarIds) {
          // Find the pillar worksheet
          const pillarWorksheet = worksheets.find((w: { id: string }) => 
            w.id.toLowerCase() === pillarId.toLowerCase() ||
            w.id.replace(/-/g, '_').toLowerCase() === pillarId.replace(/-/g, '_').toLowerCase()
          );
          
          if (pillarWorksheet) {
            console.log(`Creating recommendation: ${jackierWorksheet.id} -> ${pillarWorksheet.id}`);
            
            try {
              await worksheetRelationshipService.createRelationship({
                sourceWorksheetId: jackierWorksheet.id,
                targetWorksheetId: pillarWorksheet.id,
                relationshipType: RelationshipType.RECOMMENDED,
                triggerConditions: [
                  {
                    type: TriggerCondition.COMPLETION,
                    parameters: {}
                  }
                ],
                relevanceScore: 85,
                contextDescription: `${pillarWorksheet.title} will help you strengthen the skills needed for ${jackierWorksheet.title}.`,
                displayOrder: pillarIds.indexOf(pillarId) + 1,
                active: true
              });
            } catch (error) {
              console.error(`Error creating relationship for ${jackierWorksheet.id} -> ${pillarWorksheet.id}:`, error);
            }
          }
        }
      }
    }
    
    console.log('Worksheet relationships seeded successfully');
  } catch (error) {
    console.error('Error seeding worksheet relationships:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedWorksheetRelationships();
