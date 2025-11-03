import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import dbConnect from '@/lib/db';
import { UserRegisterData } from '@/types/User';

export const runtime = 'nodejs';



export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body: UserRegisterData = await request.json();
    const { name, email, password, phoneNumber, authProvider, firebaseUid, googleId, avatar, denomination } = body;
    console.log('Registration request body for checking denomination:', body);
    console.log('Extracted denomination value:', denomination);
    // Validation based on auth provider
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' }, 
        { status: 400 }
      );
    }

    if (authProvider === 'email' && (!email || !password)) {
      return NextResponse.json(
        { error: 'Email and password are required for email registration' }, 
        { status: 400 }
      );
    }

    if (authProvider === 'phone' && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required for phone registration' }, 
        { status: 400 }
      );
    }

    if ((authProvider === 'google') && !googleId) {
      return NextResponse.json(
        { error: 'Google ID is required for Google registration' }, 
        { status: 400 }
      );
    }
    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'Firebase UID is required' }, 
        { status: 400 }
      )
    }

    // Check if user already exists
    let existingUser;
    
    // Check by Firebase UID first (most reliable)
    if (firebaseUid) {
      existingUser = await User.findOne({ firebaseUid });
      if (existingUser) {
        // If it's the same user trying to register again, return success with existing data
        const userResponse = {
          _id: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          phoneNumber: existingUser.phoneNumber,
          isPhoneVerified: existingUser.isPhoneVerified,
          authProvider: existingUser.authProvider,
          role: existingUser.role,
          avatar: existingUser.avatar,
          denomination: existingUser.denomination
        };
        
        return NextResponse.json({ 
          message: 'User already exists',
          user: userResponse 
        }, { status: 200 });
      }
    }
    
    if (email) {
      existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' }, 
          { status: 409 }
        );
      }
    }

    if (phoneNumber) {
      existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this phone number already exists' }, 
          { status: 409 }
        );
      }
    }

    // Hash password if provided
    let hashedPassword:string = "";
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Create user
    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword || undefined,
      phoneNumber: phoneNumber || undefined,
      authProvider,
      firebaseUid,
      googleId: googleId || undefined,
      isPhoneVerified: false,
      role: 'customer' as const,
      avatar: avatar || undefined,
      denomination: denomination || ''  // Ensure denomination is always a string
    };
    
    console.log('userData before creating User:', userData);
    console.log('userData.denomination:', userData.denomination);
    
    const newUser = new User(userData);
    console.log('newUser before save - denomination:', newUser.denomination);
    
    await newUser.save();
    console.log('newUser after save - denomination:', newUser.denomination);

    // Return user data (exclude password)
    const userResponse = {
      _id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      phoneNumber: newUser.phoneNumber,
      isPhoneVerified: newUser.isPhoneVerified,
      authProvider: newUser.authProvider,
      role: newUser.role,
      avatar: newUser.avatar,
      denomination: newUser.denomination
    };
    
    return NextResponse.json({ 
      message: 'Registration successful',
      user: userResponse 
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 },
      
    );
  }
}
