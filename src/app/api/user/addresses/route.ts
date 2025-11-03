import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import UserAddress from '@/models/UserAddress';
export const runtime = 'nodejs';

// GET - Fetch user addresses
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    const addresses = await UserAddress.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: addresses
    });
    
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create new user address
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, name, fullName, street, city, state, zipCode, country, phoneNumber, isDefault } = body;

    if (!userId || !name || !fullName || !street || !city || !state || !zipCode) {
      return NextResponse.json({
        success: false,
        message: 'Required fields: userId, name, fullName, street, city, state, zipCode'
      }, { status: 400 });
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      await UserAddress.updateMany(
        { userId },
        { $set: { isDefault: false } }
      );
    }

    const newAddress = new UserAddress({
      userId,
      name,
      fullName,
      street,
      city,
      state,
      zipCode,
      country: country || 'USA',
      phoneNumber,
      isDefault: isDefault || false
    });

    const savedAddress = await newAddress.save();
    
    return NextResponse.json({
      success: true,
      message: 'Address saved successfully',
      data: savedAddress
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user address:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}