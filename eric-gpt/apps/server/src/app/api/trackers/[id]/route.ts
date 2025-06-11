import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Tracker, TrackerEntry, TrackerReflection, User } from '@/models';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/trackers/{id}:
 *   get:
 *     summary: Get a specific tracker
 *     description: Returns a specific tracker with its entries and reflection
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
 *         description: Tracker details with entries and reflection
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

    // Access id from params using proper pattern for Next.js
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

    // Get tracker reflection
    const reflection = await TrackerReflection.findOne({ trackerId: id }).lean();

    // Return tracker with entries and reflection
    return NextResponse.json({
      tracker,
      entries,
      reflection,
    });
  } catch (error) {
    console.error('Error getting tracker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get tracker', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/trackers/{id}:
 *   put:
 *     summary: Update a tracker
 *     description: Updates a specific tracker
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, completed, abandoned]
 *     responses:
 *       200:
 *         description: Tracker updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user doesn't have access to this tracker
 *       404:
 *         description: Tracker not found
 *       500:
 *         description: Server error
 */
export async function PUT(
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

    // Access id from params using proper pattern for Next.js
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
    const { title, description, status } = body;

    // Update tracker fields if provided
    if (title !== undefined) tracker.title = title;
    if (description !== undefined) tracker.description = description;
    if (status !== undefined && ['active', 'completed', 'abandoned'].includes(status)) {
      tracker.status = status;
    }

    // Save the updated tracker
    await tracker.save();

    return NextResponse.json(tracker);
  } catch (error) {
    console.error('Error updating tracker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update tracker', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/trackers/{id}:
 *   delete:
 *     summary: Delete a tracker
 *     description: Deletes a specific tracker and all its entries and reflection
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
 *         description: Tracker deleted successfully
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user doesn't have access to this tracker
 *       404:
 *         description: Tracker not found
 *       500:
 *         description: Server error
 */
export async function DELETE(
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

    // Access id from params using proper pattern for Next.js
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
        { error: 'You do not have permission to delete this tracker' },
        { status: 403 }
      );
    }

    // Delete all related entries
    await TrackerEntry.deleteMany({ trackerId: id });

    // Delete reflection if exists
    await TrackerReflection.deleteOne({ trackerId: id });

    // Delete the tracker
    await Tracker.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tracker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete tracker', message: errorMessage },
      { status: 500 }
    );
  }
}
