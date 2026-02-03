export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { IUser } from '@/models/User';
import { requireAdmin } from '@/lib/auth-helpers';
import { auth } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await connectToDatabase();

    const { id: userId } = await params;
    const body = await request.json();
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword.trim() : '';

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

    const user = await User.findById(userId).lean() as Pick<IUser, 'firebaseUid'> | null;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const firebaseUid = user.firebaseUid;
    if (!firebaseUid) {
      return NextResponse.json(
        { success: false, error: 'User has no linked account. Cannot change password.' },
        { status: 400 }
      );
    }

    try {
      await auth.updateUser(firebaseUid, { password: newPassword });
    } catch (firebaseError: unknown) {
      const msg = firebaseError instanceof Error ? firebaseError.message : 'Unknown error';
      console.error('Firebase password update error:', firebaseError);
      if (msg.includes('password')) {
        return NextResponse.json(
          { success: false, error: 'Invalid password or account does not support password login.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    console.error('Admin reset-password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update password. Please try again later.' },
      { status: 500 }
    );
  }
}
