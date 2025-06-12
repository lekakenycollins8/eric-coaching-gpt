import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define interfaces for worksheet data
interface WorksheetField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'rating' | 'checkbox' | 'multiselect' | 'info';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
}

interface Worksheet {
  id: string;
  title: string;
  description: string;
  systemPromptKey: string;
  fields: WorksheetField[];
}

/**
 * @swagger
 * /api/worksheets/{id}:
 *   get:
 *     summary: Get a specific worksheet by ID
 *     description: Retrieves a single worksheet with its metadata and form fields
 *     tags:
 *       - Worksheets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the worksheet to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Worksheet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier for the worksheet
 *                 title:
 *                   type: string
 *                   description: Title of the worksheet
 *                 description:
 *                   type: string
 *                   description: Brief description of the worksheet
 *                 systemPromptKey:
 *                   type: string
 *                   description: Key for the system prompt used for this worksheet
 *                 fields:
 *                   type: array
 *                   description: Form fields for the worksheet
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Field name/identifier
 *                       label:
 *                         type: string
 *                         description: Display label for the field
 *                       type:
 *                         type: string
 *                         enum: [text, textarea, rating, checkbox, multiselect, info]
 *                         description: Type of form field
 *                       required:
 *                         type: boolean
 *                         description: Whether the field is required
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Options for rating/multiselect fields
 *       404:
 *         description: Worksheet not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Destructure id from params to comply with Next.js 14+ requirements
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing worksheet ID' },
        { status: 400 }
      );
    }

    // Read the worksheets.json file
    const worksheetsPath = path.join(process.cwd(), 'src/data/worksheets.json');
    const worksheetsData = fs.readFileSync(worksheetsPath, 'utf8');
    const worksheets: Worksheet[] = JSON.parse(worksheetsData);

    // Find the worksheet with the matching ID
    const worksheet = worksheets.find((w: Worksheet) => w.id === id);

    if (!worksheet) {
      return NextResponse.json(
        { error: `Worksheet with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(worksheet, { status: 200 });
  } catch (error) {
    console.error(`Error fetching worksheet with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch worksheet' },
      { status: 500 }
    );
  }
}
