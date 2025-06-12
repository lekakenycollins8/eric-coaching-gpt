import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Tracker } from '@/models';
import { TrackerEntry } from '@/models';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * GET endpoint to retrieve all entries for a specific tracker
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  try {
    await connectToDatabase();

    // Get the authenticated user session or check for userId in query params
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const queryUserId = searchParams.get('userId');
    
    let userId;
    
    // Check if we have a valid session with user ID
    if (session?.user?.id) {
      userId = session.user.id;
    } 
    // Otherwise, check if userId was provided in query params (for proxy requests)
    else if (queryUserId) {
      userId = queryUserId;
    } 
    // If no user ID is available, return authentication error
    else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Access id from params - in Next.js 15, params must be awaited
    const { id } = await Promise.resolve(params);
    
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
 * POST endpoint to create or update a tracker entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  try {
    await connectToDatabase();

    // Get the authenticated user session or check for userId in query params
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const queryUserId = searchParams.get('userId');
    
    let userId;
    
    // Check if we have a valid session with user ID
    if (session?.user?.id) {
      userId = session.user.id;
    } 
    // Otherwise, check if userId was provided in query params (for proxy requests)
    else if (queryUserId) {
      userId = queryUserId;
    } 
    // If no user ID is available, return authentication error
    else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Access id from params - in Next.js 15, params must be awaited
    const { id } = await Promise.resolve(params);
    
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
    
    // Check if all entries are completed to update tracker status
    if (completed === true) { // Explicitly check for true to avoid issues with undefined
      try {
        const allEntries = await TrackerEntry.find({ trackerId: id });
        const totalEntries = allEntries.length;
        const completedEntries = allEntries.filter(e => e.completed).length;
        
        // If we have all 5 days and all are completed, mark the tracker as completed
        if (totalEntries === 5 && completedEntries === 5 && tracker.status === 'active') {
          tracker.status = 'completed';
          await tracker.save();
        }
      } catch (error) {
        console.error('Error checking tracker completion status:', error);
        // Don't throw here - we still want to return the entry even if status update fails
      }
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
