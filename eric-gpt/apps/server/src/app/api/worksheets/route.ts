import { NextResponse } from 'next/server';

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

// This is a placeholder for the worksheets API
// It will be fully implemented in Sprint 2
export async function GET() {
  try {
    // In Sprint 2, this will fetch worksheet metadata from the database
    // For now, return placeholder data
    const placeholderWorksheets = [
      {
        id: 'pillar1_mindset_shift',
        title: 'Pillar 1: Mindset Shift',
        description: 'Transform your leadership mindset from reactive to proactive.',
        systemPromptKey: 'pillar1_prompt',
        fields: [
          {
            name: 'current_challenge',
            label: 'What is your current leadership challenge?',
            type: 'textarea',
            required: true
          },
          {
            name: 'desired_outcome',
            label: 'What outcome would you like to achieve?',
            type: 'textarea',
            required: true
          }
        ]
      },
      {
        id: 'pillar2_communication',
        title: 'Pillar 2: Effective Communication',
        description: 'Enhance your communication skills for better team alignment.',
        systemPromptKey: 'pillar2_prompt',
        fields: [
          {
            name: 'communication_style',
            label: 'Describe your current communication style:',
            type: 'textarea',
            required: true
          },
          {
            name: 'improvement_areas',
            label: 'Which areas would you like to improve?',
            type: 'multiselect',
            options: ['Clarity', 'Active Listening', 'Feedback', 'Difficult Conversations'],
            required: true
          }
        ]
      }
    ];

    return NextResponse.json(
      { worksheets: placeholderWorksheets },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching worksheets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
