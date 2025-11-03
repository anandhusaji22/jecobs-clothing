import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import dbConnect from '@/lib/db';
import User from '@/models/User'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // This will throw an error if the user is not authenticated
    const authRequest = await requireAuth(request);

    await dbConnect();
    const user = await User.findOne({ firebaseUid: authRequest.user?.uid })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        denomination: user.denomination,
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authRequest = await requireAuth(request);
    const body = await request.json();
    const { name, phoneNumber, denomination } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Name must be at least 2 characters' }, { status: 400 })
    }

    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return NextResponse.json({ success: false, error: 'Name should contain only letters and spaces' }, { status: 400 })
    }

    if (phoneNumber && !/^\+?[\d\s\-\(\)]{10,}$/.test(phoneNumber.trim())) {
      return NextResponse.json({ success: false, error: 'Invalid phone number format' }, { status: 400 })
    }

    await dbConnect()
    
    // Update user in database
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: authRequest.user?.uid },
      {
        name: name.trim(),
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        denomination: denomination || null,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        denomination: updatedUser.denomination,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}