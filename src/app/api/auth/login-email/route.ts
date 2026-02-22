import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * Email/password login against MongoDB (used when Firebase sign-in fails, e.g. after password reset with MongoDB fallback).
 * Returns user in the same shape the client expects so Redux and /api/auth/user work unchanged.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailNormalized = (email as string).trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(emailNormalized)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (user.authProvider !== 'email' || !user.password) {
      return NextResponse.json(
        { success: false, error: 'This account uses a different sign-in method.' },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Token for client to store (so localStorage has a value; no server verification required for /api/auth/user)
    const token = 'email-' + crypto.randomBytes(24).toString('hex');

    const userData = {
      uid: user.firebaseUid || user._id.toString(),
      name: user.name,
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'customer',
      photoURL: user.avatar || '',
      denomination: user.denomination || '',
      isPhoneVerified: user.isPhoneVerified ?? false,
      isEmailVerified: true,
      provider: user.authProvider,
      createdAt: user.createdAt?.toISOString?.() || new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Error in login-email API:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
