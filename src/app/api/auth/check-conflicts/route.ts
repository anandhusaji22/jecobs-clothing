export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/db';



export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, phoneNumber } = body;

    const conflicts = [];

    // Check email conflict
    if (email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        conflicts.push({ field: 'email', message: 'Email already exists' });
      }
    }

    // Check phone conflict
    if (phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        conflicts.push({ field: 'phoneNumber', message: 'Phone number already exists' });
      }
    }

    return NextResponse.json({ 
      hasConflicts: conflicts.length > 0,
      conflicts 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Conflict check error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}