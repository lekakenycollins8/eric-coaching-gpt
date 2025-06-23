import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Loads all worksheets from individual JSON files
 * @returns Array of worksheet objects
 */
export async function loadAllWorksheets() {
  try {
    const worksheetsDir = path.join(process.cwd(), 'src/data/worksheets-json');
    const jsonFiles = await glob('*.json', { cwd: worksheetsDir });
    
    const worksheets = [];
    for (const file of jsonFiles) {
      const filePath = path.join(worksheetsDir, file);
      const worksheetData = fs.readFileSync(filePath, 'utf8');
      const worksheetArray = JSON.parse(worksheetData);
      
      // Each file contains an array of worksheets, typically just one
      if (Array.isArray(worksheetArray)) {
        worksheets.push(...worksheetArray);
      } else {
        console.warn(`Worksheet file ${file} does not contain an array of worksheets`);
      }
    }
    
    return worksheets;
  } catch (error) {
    console.error('Error loading worksheets:', error);
    throw error;
  }
}

/**
 * Loads a specific worksheet by ID from individual JSON files
 * @param id The worksheet ID to find
 * @returns The worksheet object or null if not found
 */
export async function loadWorksheetById(id: string) {
  try {
    // First try to load directly from a file that matches the ID pattern
    const worksheetsDir = path.join(process.cwd(), 'src/data/worksheets-json');
    
    // Try to find a file that might match this ID
    const jsonFiles = await glob('*.json', { cwd: worksheetsDir });
    
    // Try direct file match first (faster)
    const normalizedId = id.replace(/-/g, '_').toLowerCase(); // Handle IDs with different formats
    
    // Look for exact matches first
    for (const file of jsonFiles) {
      const filePath = path.join(worksheetsDir, file);
      const worksheetData = fs.readFileSync(filePath, 'utf8');
      const worksheetArray = JSON.parse(worksheetData);
      
      if (Array.isArray(worksheetArray)) {
        // Look for a worksheet with the matching ID
        const worksheet = worksheetArray.find(w => 
          w.id === id || 
          w.id.toLowerCase() === id.toLowerCase() || 
          w.id.replace(/-/g, '_').toLowerCase() === normalizedId
        );
        
        if (worksheet) {
          return worksheet;
        }
      }
    }
    
    // If no direct match, load all worksheets and find by ID
    const allWorksheets = await loadAllWorksheets();
    return allWorksheets.find(worksheet => 
      worksheet.id === id || 
      worksheet.id.toLowerCase() === id.toLowerCase() || 
      worksheet.id.replace(/-/g, '_').toLowerCase() === normalizedId
    ) || null;
  } catch (error) {
    console.error(`Error loading worksheet ${id}:`, error);
    throw error;
  }
}
