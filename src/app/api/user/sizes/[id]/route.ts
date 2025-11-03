import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import UserSize from '@/models/UserSize';
export const runtime = 'nodejs';

// GET - Fetch specific user size
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const size = await UserSize.findById(id);
    
    if (!size) {
      return NextResponse.json({
        success: false,
        message: 'Size not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: size
    });
    
  } catch (error) {
    console.error('Error fetching user size:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update user size
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { name, type, measurements, isDefault } = body;

    if (!name || !measurements) {
      return NextResponse.json({
        success: false,
        message: 'Required fields: name, measurements'
      }, { status: 400 });
    }

    // Get the existing size to preserve the type if not provided
    const existingSize = await UserSize.findById(id);
    if (!existingSize) {
      return NextResponse.json({
        success: false,
        message: 'Size not found'
      }, { status: 404 });
    }

    const sizeType = type || existingSize.type || 'general';

    // If this is set as default, remove default from other sizes of same type and user
    if (isDefault) {
      await UserSize.updateMany(
        { userId: existingSize.userId, type: sizeType },
        { $set: { isDefault: false } }
      );
    }

    const updatedSize = await UserSize.findByIdAndUpdate(
      id,
      { name, type: sizeType, measurements, isDefault: isDefault || false },
      { new: true, runValidators: true }
    );

    if (!updatedSize) {
      return NextResponse.json({
        success: false,
        message: 'Size not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Size updated successfully',
      data: updatedSize
    });
    
  } catch (error) {
    console.error('Error updating user size:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Delete user size
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const deletedSize = await UserSize.findByIdAndDelete(id);

    if (!deletedSize) {
      return NextResponse.json({
        success: false,
        message: 'Size not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Size deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user size:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}