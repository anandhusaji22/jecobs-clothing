export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import AvailableDate from '@/models/AvailableDate'
import { requireAdmin } from '@/lib/auth-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await dbConnect()
    
    const { id } = await params;
    const body = await request.json()
    const { normalSlots, emergencySlots, emergencySlotCost, isAvailable } = body
    
    const updatedDate = await AvailableDate.findByIdAndUpdate(
      id,
      {
        ...(normalSlots !== undefined && { normalSlots }),
        ...(emergencySlots !== undefined && { emergencySlots }),
        ...(emergencySlotCost !== undefined && { emergencySlotCost }),
        ...(isAvailable !== undefined && { isAvailable })
      },
      { new: true, runValidators: true }
    )
    
    if (!updatedDate) {
      return NextResponse.json(
        { success: false, error: 'Available date not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: updatedDate
    })
    
  } catch (error) {
    console.error('Error updating available date:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update available date' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await dbConnect()
    
    const { id } = await params;
    const deletedDate = await AvailableDate.findByIdAndDelete(id)
    
    if (!deletedDate) {
      return NextResponse.json(
        { success: false, error: 'Available date not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Available date deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting available date:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete available date' },
      { status: 500 }
    )
  }
}