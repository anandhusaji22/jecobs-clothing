import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import UserSize from '@/models/UserSize';
export const runtime = 'nodejs';

// GET - Fetch user sizes
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    const query: { userId: string; type?: string } = { userId };
    if (type) {
      query.type = type;
    }

    const sizes = await UserSize.find(query).sort({ isDefault: -1, createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: sizes
    });
    
  } catch (error) {
    console.error('Error fetching user sizes:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create new user size
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, name, type, measurements, isDefault } = body;

    if (!userId || !name || !measurements) {
      return NextResponse.json({
        success: false,
        message: 'Required fields: userId, name, measurements'
      }, { status: 400 });
    }

    // If type is provided and this is set as default, remove default from other sizes of same type
    if (isDefault && type) {
      await UserSize.updateMany(
        { userId, type },
        { $set: { isDefault: false } }
      );
    }

    const newSize = new UserSize({
      userId,
      name,
      type: type || 'general', // Default to 'general' if not provided
      measurements,
      isDefault: isDefault || false
    });

    const savedSize = await newSize.save();
    
    return NextResponse.json({
      success: true,
      message: 'Size saved successfully',
      data: savedSize
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user size:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}