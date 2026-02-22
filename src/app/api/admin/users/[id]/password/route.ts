export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth-helpers';
import { auth, getUserByEmail } from '@/lib/firebase/admin';

/**
 * Admin-only: set a user's password directly (no OTP).
 * Updates MongoDB and, when available, Firebase.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await connectDB();

    const { id: userId } = await params;
    const body = await request.json();
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';

    if (!newPassword) {
      return NextResponse.json(
        { success: false, error: 'New password is required' },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.authProvider === 'google' && !user.password) {
      return NextResponse.json(
        { success: false, error: 'This account uses Google sign-in only. Password cannot be set.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    const emailNormalized = user.email?.trim().toLowerCase();
    if (emailNormalized) {
      try {
        const userRecord = await getUserByEmail(emailNormalized);
        await auth.updateUser(userRecord.uid, { password: newPassword });
      } catch (firebaseError) {
        console.error('Admin set password: Firebase update failed (MongoDB was updated):', firebaseError);
        // MongoDB is already updated; user can log in via email-login API
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error in admin set-password API:', error);
    const message = error instanceof Error ? error.message : 'Failed to update password';
    const status = message === 'Admin access required' || message.includes('authorization') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
