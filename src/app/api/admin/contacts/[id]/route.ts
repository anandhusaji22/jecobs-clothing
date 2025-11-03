export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Contact from '@/models/Contact'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await dbConnect()
    
    const { id } = await params;
    const contact = await Contact.findById(id)
    
    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    // Mark as read if it's unread
    if (contact.status === 'unread') {
      await Contact.findByIdAndUpdate(id, { status: 'read' })
      contact.status = 'read'
    }
    
    return NextResponse.json({
      success: true,
      data: contact
    })
    
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

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
    const { status, priority, adminNotes, repliedAt } = body
    
    const updateData: {
      status?: string;
      priority?: string;
      adminNotes?: string;
      repliedAt?: Date;
    } = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    if (repliedAt) updateData.repliedAt = new Date(repliedAt)
    
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    
    if (!updatedContact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: updatedContact
    })
    
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update contact' },
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
    const deletedContact = await Contact.findByIdAndDelete(id)
    
    if (!deletedContact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}