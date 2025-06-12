import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Tracker } from '@/models/Tracker';
import { TrackerEntry } from '@/models/TrackerEntry';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET endpoint to retrieve a specific tracker by ID
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

    // Check if tracker exists
    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker not found' },
        { status: 404 }
      );
    }

    // Check if the tracker belongs to the authenticated user
    if (tracker.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to access this tracker' },
        { status: 403 }
      );
    }

    // Return the tracker data
    return NextResponse.json(tracker);
  } catch (error) {
    console.error('Error retrieving tracker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to retrieve tracker', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update a specific tracker by ID
 */
export async function PUT(
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

    // Check if tracker exists
    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker not found' },
        { status: 404 }
      );
    }

    // Check if the tracker belongs to the authenticated user
    if (tracker.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this tracker' },
        { status: 403 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Update the tracker
    const updatedTracker = await Tracker.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    // Return the updated tracker
    return NextResponse.json(updatedTracker);
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
 * DELETE endpoint to delete a specific tracker by ID
 */
export async function DELETE(
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

    // Check if tracker exists
    if (!tracker) {
      return NextResponse.json(
        { error: 'Tracker not found' },
        { status: 404 }
      );
    }

    // Check if the tracker belongs to the authenticated user
    if (tracker.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this tracker' },
        { status: 403 }
      );
    }

    // Delete the tracker
    await Tracker.findByIdAndDelete(id);
    
    // Delete all associated tracker entries
    await TrackerEntry.deleteMany({ trackerId: id });

    // Return success message
    return NextResponse.json({ message: 'Tracker deleted successfully' });
  } catch (error) {
    console.error('Error deleting tracker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete tracker', message: errorMessage },
      { status: 500 }
    );
  }
}
