export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Contact from '@/models/Contact'
import { requireAdmin } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    // Contact form submission - no admin check needed (public endpoint)
    
    await dbConnect()
    
    const body = await request.json()
    const { name, email, phoneNumber, message } = body
    
    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }
    
    // Create new contact enquiry
    const newContact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber?.trim(),
      message: message.trim()
    })
    
    await newContact.save()
    
    return NextResponse.json({
      success: true,
      message: 'Thank you for your enquiry! We will get back to you soon.',
      data: {
        id: newContact._id,
        name: newContact.name,
        email: newContact.email,
        createdAt: newContact.createdAt
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error saving contact enquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit enquiry. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Build query
    const query: { status?: string; priority?: string } = {}
    if (status && status !== 'all') {
      query.status = status
    }
    if (priority && priority !== 'all') {
      query.priority = priority
    }
    
    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Get total count for pagination
    const totalContacts = await Contact.countDocuments(query)
    const totalPages = Math.ceil(totalContacts / limit)
    
    // Get status counts
    const statusCounts = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
    
    const stats = {
      total: totalContacts,
      unread: statusCounts.find(s => s._id === 'unread')?.count || 0,
      read: statusCounts.find(s => s._id === 'read')?.count || 0,
      replied: statusCounts.find(s => s._id === 'replied')?.count || 0
    }
    
    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalContacts,
        itemsPerPage: limit
      },
      stats
    })
    
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enquiries' },
      { status: 500 }
    )
  }
}