import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import OTP from '@/models/OTP';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { auth, getUserByEmail } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    // Validate required fields
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    const emailNormalized = (email as string).trim().toLowerCase();
    if (!emailRegex.test(emailNormalized)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: 'OTP must be 6 digits' },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email: emailNormalized,
      purpose: 'password_reset',
      verified: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'No valid OTP found. Please request a new one.' },
        { status: 404 }
      );
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts;
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` 
        },
        { status: 400 }
      );
    }

    // OTP is valid - Update password: try Firebase first, fallback to MongoDB (e.g. when Firebase key is invalid)
    let passwordUpdated = false;
    try {
      const userRecord = await getUserByEmail(emailNormalized);
      await auth.updateUser(userRecord.uid, {
        password: newPassword
      });
      passwordUpdated = true;
    } catch (error: unknown) {
      console.error('Error updating password in Firebase:', error);
      const code = (error as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        return NextResponse.json(
          { success: false, error: 'Account not found in our system. Please sign up again or contact support.' },
          { status: 400 }
        );
      }
      // When Firebase Admin key is invalid/removed (app/invalid-credential etc.), update password in MongoDB so login still works via email API
      const mongoUser = await User.findOne({ email: emailNormalized });
      if (mongoUser && (mongoUser.authProvider === 'email' || mongoUser.password)) {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        mongoUser.password = hashedPassword;
        await mongoUser.save();
        passwordUpdated = true;
      }
      if (!passwordUpdated) {
        return NextResponse.json(
          { success: false, error: 'Failed to update password. Please try again or request a new OTP.' },
          { status: 500 }
        );
      }
    }

    // Mark OTP as verified and delete it
    await OTP.deleteOne({ _id: otpRecord._id });
    await OTP.deleteMany({ email: emailNormalized, purpose: 'password_reset' });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Password reset successful. You can now login with your new password.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in reset-password API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password. Please try again later.' },
      { status: 500 }
    );
  }
}
