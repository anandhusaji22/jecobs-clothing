export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';



export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { firebaseUid, email, displayName, denomination } = await request.json();

    if (!firebaseUid || !email) {
      return NextResponse.json(
        { error: 'Firebase UID and email are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { firebaseUid },
        { email }
      ]
    });
    
    if (existingUser) {
      return NextResponse.json({
        user: existingUser,
        message: 'User already exists'
      });
    }
    
    // Create new user with minimal data
    const newUser = new User({
      firebaseUid,
      email,
      name: displayName || email.split('@')[0],
      role: 'customer',
      avatar: '',
      denomination: denomination || '',
      phoneNumber: '',
      isPhoneVerified: false,
      authProvider: 'firebase-auto',
      createdAt: new Date(),
    });
    
    await newUser.save();
    
    return NextResponse.json({
      user: newUser,
      message: 'User created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Fallback user creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}