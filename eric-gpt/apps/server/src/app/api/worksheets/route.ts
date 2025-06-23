import { NextResponse } from 'next/server';
import { loadAllWorksheets } from '@/utils/worksheetLoader';

/**
 * @swagger
 * /api/worksheets:
 *   get:
 *     summary: Get available worksheets
 *     description: Retrieves a list of all available worksheets with their metadata and form fields
 *     tags:
 *       - Worksheets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of worksheets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 worksheets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique identifier for the worksheet
 *                       title:
 *                         type: string
 *                         description: Title of the worksheet
 *                       description:
 *                         type: string
 *                         description: Brief description of the worksheet
 *                       systemPromptKey:
 *                         type: string
 *                         description: Key for the system prompt used for this worksheet
 *                       fields:
 *                         type: array
 *                         description: Form fields for the worksheet
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               description: Field name/identifier
 *                             label:
 *                               type: string
 *                               description: Display label for the field
 *                             type:
 *                               type: string
 *                               enum: [text, textarea, select, multiselect, checkbox]
 *                               description: Type of form field
 *                             required:
 *                               type: boolean
 *                               description: Whether the field is required
 *                             options:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               description: Options for select/multiselect fields
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * GET handler for the worksheets API endpoint
 * Updated to read from individual JSON files instead of the combined worksheets.json
 */
export async function GET() {
  try {
    // Load worksheets from individual JSON files
    const worksheets = await loadAllWorksheets();
    
    return NextResponse.json({ worksheets }, { status: 200 });
  } catch (error) {
    console.error('Error fetching worksheets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
