import { generateAIDiagnosis, parseDiagnosisResponse, determineFollowupWorksheets } from '../utils/diagnosisUtils';
import { loadWorksheet } from '../utils/followupUtils';

// Mock formatted Q&A for testing
const mockQA = [
  {
    question: "How would you describe your leadership style?",
    answer: "I try to be collaborative and supportive, but sometimes I struggle with delegation and trusting my team to handle important tasks."
  },
  {
    question: "What is your biggest leadership challenge?",
    answer: "I find it difficult to have tough conversations with team members when they're underperforming. I tend to avoid conflict."
  },
  {
    question: "How do you handle stress and pressure?",
    answer: "I often work longer hours and take on more responsibility myself rather than distributing the workload."
  }
];

async function runTest() {
  try {
    console.log("Testing diagnosis utilities...");
    
    // Test generating AI diagnosis
    console.log("\n1. Testing generateAIDiagnosis...");
    const diagnosis = await generateAIDiagnosis(mockQA, "Test User");
    console.log("Diagnosis generated successfully:");
    console.log("- Summary:", diagnosis.summary.substring(0, 100) + "...");
    console.log("- Strengths:", diagnosis.strengths.length, "items");
    console.log("- Challenges:", diagnosis.challenges.length, "items");
    console.log("- Recommendations:", diagnosis.recommendations.length, "items");
    console.log("- Recommended pillars:", diagnosis.followupWorksheets.pillars);
    console.log("- Recommended followup:", diagnosis.followupWorksheets.followup);
    
    // Test determining follow-up worksheets
    console.log("\n2. Testing determineFollowupWorksheets...");
    const followupWorksheets = determineFollowupWorksheets(diagnosis);
    console.log("Follow-up worksheets determined:");
    console.log("- Pillars:", followupWorksheets.pillars);
    console.log("- Followup:", followupWorksheets.followup);
    
    // Test loading a worksheet
    console.log("\n3. Testing loadWorksheet...");
    if (followupWorksheets.pillars.length > 0) {
      const pillarWorksheet = await loadWorksheet(followupWorksheets.pillars[0]);
      console.log(`Loaded pillar worksheet "${pillarWorksheet?.title}" successfully`);
      console.log(`- Questions: ${pillarWorksheet?.questions?.length || 0}`);
    }
    
    const followupWorksheet = await loadWorksheet(followupWorksheets.followup);
    console.log(`Loaded followup worksheet "${followupWorksheet?.title}" successfully`);
    console.log(`- Questions: ${followupWorksheet?.questions?.length || 0}`);
    
    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
runTest();
