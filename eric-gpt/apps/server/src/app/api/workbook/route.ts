import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { loadWorkbook } from '@/utils/workbookLoader';
import { connectToDatabase } from '@/db/connection';
import { User } from '@/models';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/workbook:
 *   get:
 *     summary: Get the Jackier Method Workbook
 *     description: Retrieves the Jackier Method Workbook structure with sections and questions
 *     tags:
 *       - Workbook
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workbook retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workbook:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique identifier for the workbook
 *                     title:
 *                       type: string
 *                       description: Title of the workbook
 *                     description:
 *                       type: string
 *                       description: Brief description of the workbook
 *                     isRequired:
 *                       type: boolean
 *                       description: Whether the workbook is required for all users
 *                     sections:
 *                       type: array
 *                       description: Sections of the workbook
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             description: Title of the section
 *                           description:
 *                             type: string
 *                             description: Description of the section
 *                           questions:
 *                             type: array
 *                             description: Questions in the section
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   description: Unique identifier for the question
 *                                 text:
 *                                   type: string
 *                                   description: Question text
 *                                 type:
 *                                   type: string
 *                                   enum: [text, textarea, checkbox, multiselect, rating]
 *                                   description: Type of question
 *                                 options:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                                   description: Options for checkbox/multiselect/rating questions
 *                                 required:
 *                                   type: boolean
 *                                   description: Whether the question is required
 *       401:
 *         description: Unauthorized - User is not authenticated
 *       403:
 *         description: Forbidden - User does not have an active subscription
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
 * GET handler for the workbook API endpoint
 * Returns the Jackier Method Workbook structure
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has an active subscription
    await connectToDatabase();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has an active subscription
    const validStatuses = ['active', 'past_due'];
    if (!user.subscription || !validStatuses.includes(user.subscription.status)) {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      );
    }

    // Load workbook from JSON file
    const workbook = await loadWorkbook();
    if (!workbook) {
      return NextResponse.json(
        { error: 'Workbook not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ workbook }, { status: 200 });
  } catch (error) {
    console.error('Error fetching workbook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
