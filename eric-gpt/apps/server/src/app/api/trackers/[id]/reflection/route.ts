import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Tracker, TrackerReflection } from '@/models';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/trackers/{id}/reflection:
 *   get:
 *     summary: Get reflection for a tracker
 *     description: Returns the reflection for a specific tracker
 *     tags:
 *       - Trackers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tracker ID
 *     responses:
 *       200:
 *         description: Tracker reflection
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user doesn't have access to this tracker
 *       404:
 *         description: Tracker not found
 *       500:
 *         description: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Access id from params
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tracker ID is required' },
        { status: 400 }
      );
    }

    // Validate tracker ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid tracker ID format' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the tracker by ID
    const tracker = await Tracker.findById(id);

    // Check if the tracker exists
    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker not found' },
        { status: 404 }
      );
    }

    // Check if the user has access to this tracker
    if (tracker.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this tracker' },
        { status: 403 }
      );
    }

    // Get tracker reflection
    const reflection = await TrackerReflection.findOne({ trackerId: id }).lean();

    if (!reflection) {
      return NextResponse.json(null);
    }

    return NextResponse.json(reflection);
  } catch (error) {
    console.error('Error getting tracker reflection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get tracker reflection', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/trackers/{id}/reflection:
 *   post:
 *     summary: Create or update a tracker reflection
 *     description: Creates or updates the reflection for a specific tracker
 *     tags:
 *       - Trackers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tracker ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reflection created or updated successfully
 *       400:
 *         description: Bad request - missing content
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user doesn't have access to this tracker
 *       404:
 *         description: Tracker not found
 *       500:
 *         description: Server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Access id from params
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tracker ID is required' },
        { status: 400 }
      );
    }

    // Validate tracker ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid tracker ID format' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the tracker by ID
    const tracker = await Tracker.findById(id);

    // Check if the tracker exists
    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker not found' },
        { status: 404 }
      );
    }

    // Check if the user has access to this tracker
    if (tracker.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this tracker' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { content } = body;

    // Validate content
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Check if reflection already exists
    let reflection = await TrackerReflection.findOne({ trackerId: id });

    if (reflection) {
      // Update existing reflection
      reflection.content = content;
      await reflection.save();
    } else {
      // Create new reflection
      reflection = new TrackerReflection({
        trackerId: id,
        userId,
        content,
      });
      await reflection.save();
    }

    return NextResponse.json(reflection);
  } catch (error) {
    console.error('Error updating tracker reflection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update tracker reflection', message: errorMessage },
      { status: 500 }
    );
  }
}
