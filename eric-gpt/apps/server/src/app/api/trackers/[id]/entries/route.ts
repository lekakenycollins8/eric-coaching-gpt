import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Tracker, TrackerEntry } from '@/models';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/trackers/{id}/entries:
 *   get:
 *     summary: Get all entries for a tracker
 *     description: Returns all entries for a specific tracker
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
 *         description: List of tracker entries
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

    // Get tracker entries
    const entries = await TrackerEntry.find({ trackerId: id })
      .sort({ day: 1 })
      .lean();

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error getting tracker entries:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get tracker entries', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/trackers/{id}/entries:
 *   post:
 *     summary: Create or update a tracker entry
 *     description: Creates or updates an entry for a specific day of a tracker
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
 *               - day
 *             properties:
 *               day:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               completed:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entry created or updated successfully
 *       400:
 *         description: Bad request - invalid day
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
    const { day, completed, notes } = body;

    // Validate day
    if (!day || day < 1 || day > 5) {
      return NextResponse.json(
        { error: 'Day must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if entry already exists
    let entry = await TrackerEntry.findOne({ trackerId: id, day });

    if (entry) {
      // Update existing entry
      if (completed !== undefined) entry.completed = completed;
      if (notes !== undefined) entry.notes = notes;
      await entry.save();
    } else {
      // Create new entry
      entry = new TrackerEntry({
        trackerId: id,
        userId,
        day,
        completed: completed !== undefined ? completed : false,
        notes: notes || '',
      });
      await entry.save();
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating tracker entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update tracker entry', message: errorMessage },
      { status: 500 }
    );
  }
}
