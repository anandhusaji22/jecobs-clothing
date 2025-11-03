import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import UserAddress from '@/models/UserAddress';
export const runtime = 'nodejs';
// GET - Fetch specific user address
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const address = await UserAddress.findById(id);
    
    if (!address) {
      return NextResponse.json({
        success: false,
        message: 'Address not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: address
    });
    
  } catch (error) {
    console.error('Error fetching user address:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update user address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { name, fullName, street, city, state, zipCode, country, phoneNumber, isDefault } = body;

    // If we're updating address data (not just isDefault), validate required fields
    const isUpdatingAddressData = name || fullName || street || city || state || zipCode;
    if (isUpdatingAddressData && (!name || !fullName || !street || !city || !state || !zipCode)) {
      return NextResponse.json({
        success: false,
        message: 'Required fields: name, fullName, street, city, state, zipCode'
      }, { status: 400 });
    }

    // If this is set as default, remove default from other addresses of same user
    if (isDefault) {
      const existingAddress = await UserAddress.findById(id);
      if (existingAddress) {
        await UserAddress.updateMany(
          { userId: existingAddress.userId },
          { $set: { isDefault: false } }
        );
      }
    }

    // Build update object dynamically - only include provided fields
    const updateObject: Partial<{
      name: string;
      fullName: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      phoneNumber: string;
      isDefault: boolean;
    }> = {};
    if (name !== undefined) updateObject.name = name;
    if (fullName !== undefined) updateObject.fullName = fullName;
    if (street !== undefined) updateObject.street = street;
    if (city !== undefined) updateObject.city = city;
    if (state !== undefined) updateObject.state = state;
    if (zipCode !== undefined) updateObject.zipCode = zipCode;
    if (country !== undefined) updateObject.country = country;
    if (phoneNumber !== undefined) updateObject.phoneNumber = phoneNumber;
    if (isDefault !== undefined) updateObject.isDefault = isDefault;

    const updatedAddress = await UserAddress.findByIdAndUpdate(
      id,
      updateObject,
      { new: true, runValidators: true }
    );

    if (!updatedAddress) {
      return NextResponse.json({
        success: false,
        message: 'Address not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress
    });
    
  } catch (error) {
    console.error('Error updating user address:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Delete user address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const deletedAddress = await UserAddress.findByIdAndDelete(id);

    if (!deletedAddress) {
      return NextResponse.json({
        success: false,
        message: 'Address not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user address:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}