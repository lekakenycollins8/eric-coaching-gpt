import mongoose from "mongoose";
import { connectToDatabase } from "./connection";

// Export the connection function
export { connectToDatabase };

// Connect to the database when this module is imported
connectToDatabase().catch((error) => {
  console.error("Error connecting to database:", error);
  process.exit(1);
});

// Export the database client for use in API routes
const client = mongoose.connection.getClient().db("eric_gpt_db");

export { client };
