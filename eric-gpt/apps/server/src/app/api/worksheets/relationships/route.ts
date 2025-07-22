import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../db/connection';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import worksheetRelationshipService from '../../../../services/worksheetRelationshipService';
import { hasFeatureAccess } from '../../../../utils/subscription';
import { getUserByEmail } from '../../../../models/User';

/**
 * @swagger
 * /api/worksheets/relationships:
 *   get:
 *     summary: Get worksheet relationships
 *     description: Retrieves relationships for a specific worksheet
 *     parameters:
 *       - name: worksheetId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: direction
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [from, to, both]
 *           default: from
 *     responses:
 *       200:
 *         description: List of worksheet relationships
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - subscription required
 */
export async function GET(request: NextRequest) {
  try {
    let userEmail: string | null = null;
    
    // First try to get the session from NextAuth
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      userEmail = session.user.email;
    } else {
      // If no session, check for authorization header
      const authHeader = request.headers.get('Authorization');
      const userIdHeader = request.headers.get('x-user-id');
      const userEmailHeader = request.headers.get('x-user-email');
      
      if (userEmailHeader) {
        userEmail = userEmailHeader;
        console.log('Using email from x-user-email header:', userEmail);
      } else if (authHeader && userIdHeader) {
        // We have a user ID but no email, we could look up the user by ID here
        // This is a fallback approach
        console.log('Got auth header and user ID header, but no email header');
      } else {
        console.log('No valid authentication found in request');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }

    // Connect to the database
    await connectToDatabase();
    
    // Get the user
    if (!userEmail) {
      console.log('No email available to look up user');
      return NextResponse.json({ error: 'Authentication required - valid email needed' }, { status: 401 });
    }
    
    const user = await getUserByEmail(userEmail);
    if (!user) {
      console.log('User not found with email:', userEmail);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to worksheets
    const hasAccess = await hasFeatureAccess(user, 'worksheets');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Subscription required for worksheet access' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const worksheetId = searchParams.get('worksheetId');
    const direction = searchParams.get('direction') || 'from';

    if (!worksheetId) {
      return NextResponse.json({ error: 'worksheetId is required' }, { status: 400 });
    }

    let relationships;
    
    // Get relationships based on direction
    if (direction === 'from') {
      relationships = await worksheetRelationshipService.getRelationshipsFromSource(worksheetId);
    } else if (direction === 'to') {
      relationships = await worksheetRelationshipService.getRelationshipsToTarget(worksheetId);
    } else if (direction === 'both') {
      const fromRelationships = await worksheetRelationshipService.getRelationshipsFromSource(worksheetId);
      const toRelationships = await worksheetRelationshipService.getRelationshipsToTarget(worksheetId);
      relationships = {
        from: fromRelationships,
        to: toRelationships
      };
    } else {
      return NextResponse.json({ error: 'Invalid direction parameter' }, { status: 400 });
    }

    return NextResponse.json({ relationships });
  } catch (error) {
    console.error('Error retrieving worksheet relationships:', error);
    return NextResponse.json({ error: 'Failed to retrieve worksheet relationships' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/worksheets/relationships:
 *   post:
 *     summary: Create a worksheet relationship
 *     description: Creates a new relationship between worksheets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceWorksheetId
 *               - targetWorksheetId
 *               - relationshipType
 *               - contextDescription
 *             properties:
 *               sourceWorksheetId:
 *                 type: string
 *               targetWorksheetId:
 *                 type: string
 *               relationshipType:
 *                 type: string
 *               triggerConditions:
 *                 type: array
 *               relevanceScore:
 *                 type: number
 *               contextDescription:
 *                 type: string
 *               displayOrder:
 *                 type: number
 *     responses:
 *       201:
 *         description: Relationship created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 */
export async function POST(request: NextRequest) {
  try {
    let userEmail: string | null = null;
    
    // First try to get the session from NextAuth
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      userEmail = session.user.email;
    } else {
      // If no session, check for authorization header
      const authHeader = request.headers.get('Authorization');
      const userIdHeader = request.headers.get('x-user-id');
      const userEmailHeader = request.headers.get('x-user-email');
      
      if (userEmailHeader) {
        userEmail = userEmailHeader;
        console.log('Using email from x-user-email header:', userEmail);
      } else if (authHeader && userIdHeader) {
        // We have a user ID but no email, we could look up the user by ID here
        // This is a fallback approach
        console.log('Got auth header and user ID header, but no email header');
      } else {
        console.log('No valid authentication found in request');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }

    // Connect to the database
    await connectToDatabase();
    
    // Get the user
    if (!userEmail) {
      console.log('No email available to look up user');
      return NextResponse.json({ error: 'Authentication required - valid email needed' }, { status: 401 });
    }
    
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to worksheet relationships feature
    const hasAccess = await hasFeatureAccess(user, 'worksheet_relationships');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Subscription required for creating worksheet relationships' }, { status: 403 });
    }

    // Parse the request body
    const relationshipData = await request.json();
    
    // Validate required fields
    const requiredFields = ['sourceWorksheetId', 'targetWorksheetId', 'relationshipType', 'contextDescription'];
    for (const field of requiredFields) {
      if (!relationshipData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Create the relationship
    const relationship = await worksheetRelationshipService.createRelationship(relationshipData);

    return NextResponse.json({ relationship }, { status: 201 });
  } catch (error) {
    console.error('Error creating worksheet relationship:', error);
    return NextResponse.json({ error: 'Failed to create worksheet relationship' }, { status: 500 });
  }
}
