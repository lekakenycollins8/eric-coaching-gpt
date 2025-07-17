import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Loads the Jackier Method Workbook from JSON file
 * @returns Workbook object or null if not found
 */
export async function loadWorkbook() {
  try {
    const dataDir = path.join(process.cwd(), 'src/data');
    const filePath = path.join(dataDir, 'jackier-method-workbook.json');
    
    if (!fs.existsSync(filePath)) {
      console.error(`Workbook file not found at ${filePath}`);
      return null;
    }
    
    const workbookData = fs.readFileSync(filePath, 'utf8');
    const workbook = JSON.parse(workbookData);
    
    return workbook;
  } catch (error) {
    console.error('Error loading workbook:', error);
    throw error;
  }
}

/**
 * Loads all follow-up worksheets from JSON file
 * @returns Array of follow-up worksheet objects
 */
export async function loadAllFollowups() {
  try {
    const dataDir = path.join(process.cwd(), 'src/data');
    const filePath = path.join(dataDir, 'jackier-method-followup.json');
    
    if (!fs.existsSync(filePath)) {
      console.error(`Follow-up worksheets file not found at ${filePath}`);
      return [];
    }
    
    const followupData = fs.readFileSync(filePath, 'utf8');
    const followups = JSON.parse(followupData);
    
    if (!Array.isArray(followups)) {
      console.warn('Follow-up worksheets file does not contain an array');
      return [];
    }
    
    return followups;
  } catch (error) {
    console.error('Error loading follow-up worksheets:', error);
    throw error;
  }
}

/**
 * Loads a specific follow-up worksheet by ID
 * @param id The follow-up worksheet ID to find
 * @returns The follow-up worksheet object or null if not found
 */
export async function loadFollowupById(id: string) {
  try {
    const followups = await loadAllFollowups();
    
    // Normalize IDs for comparison
    const normalizedId = id.replace(/-/g, '_').toLowerCase();
    
    return followups.find(followup => 
      followup.id === id || 
      followup.id.toLowerCase() === id.toLowerCase() || 
      followup.id.replace(/-/g, '_').toLowerCase() === normalizedId
    ) || null;
  } catch (error) {
    console.error(`Error loading follow-up worksheet ${id}:`, error);
    throw error;
  }
}

/**
 * Seeds the workbook into the database if it doesn't exist
 * @param WorkbookModel The Mongoose model for Workbook
 */
export async function seedWorkbook(WorkbookModel: any) {
  try {
    // Check if workbook already exists in database
    const existingWorkbook = await WorkbookModel.findOne({ 
      title: "The Jackier Method of Leadership" 
    }).exec();
    
    if (existingWorkbook) {
      console.log('Workbook already exists in database');
      return existingWorkbook;
    }
    
    // Load workbook from JSON file
    const workbookData = await loadWorkbook();
    
    if (!workbookData) {
      console.error('Failed to load workbook data for seeding');
      return null;
    }
    
    // Create new workbook in database
    const newWorkbook = new WorkbookModel(workbookData);
    await newWorkbook.save();
    
    console.log('Workbook seeded successfully');
    return newWorkbook;
  } catch (error) {
    console.error('Error seeding workbook:', error);
    throw error;
  }
}
