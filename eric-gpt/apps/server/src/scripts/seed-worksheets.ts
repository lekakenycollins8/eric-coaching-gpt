// Use CommonJS require for better compatibility with different environments
import { connectToDatabase } from '../db/connection';
import Worksheet from '../models/Worksheet';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

// Read JSON file directly
const worksheetsJsonPath = path.join(process.cwd(), 'src/data/worksheets.json');
const worksheetsData = JSON.parse(fs.readFileSync(worksheetsJsonPath, 'utf8'));

console.log(`Loaded ${worksheetsData.length} worksheets from JSON file`);
console.log('First worksheet ID:', worksheetsData[0]?.id);

/**
 * Script to seed the database with worksheets from the JSON file
 */
async function seedWorksheets() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    
    console.log('Starting worksheet seeding...');
    
    // Count existing worksheets
    const existingCount = await Worksheet.countDocuments();
    console.log(`Found ${existingCount} existing worksheets in database`);
    
    // If we already have worksheets, confirm before overwriting
    if (existingCount > 0) {
      console.log('Clearing existing worksheets...');
      await Worksheet.deleteMany({});
      console.log('Existing worksheets cleared');
    }
    
    // Insert all worksheets from the JSON file
    console.log(`Seeding ${worksheetsData.length} worksheets from JSON data...`);
    
    const results = await Worksheet.insertMany(worksheetsData);
    
    console.log(`Successfully seeded ${results.length} worksheets`);
    console.log('Worksheet IDs:');
    results.forEach((worksheet) => {
      console.log(`- ${worksheet.id}: ${worksheet.title}`);
    });
    
    console.log('Worksheet seeding completed successfully');
  } catch (error) {
    console.error('Error seeding worksheets:', error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedWorksheets();
