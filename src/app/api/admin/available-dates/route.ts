export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import AvailableDate from '@/models/AvailableDate'
import { requireAdmin } from '@/lib/auth-helpers'



export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    
    let query = {}
    
    if (month && year) {
      // Use UTC to create date range to avoid timezone issues
      const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0, 0))
      const endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23, 59, 59, 999))
      query = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    } else {
      // Default: get dates from today onwards (using UTC)
      const now = new Date()
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
      query = {
        date: { $gte: today }
      }
    }
    
    const availableDates = await AvailableDate.find(query)
      .sort({ date: 1 })
      .lean()
    
    return NextResponse.json({
      success: true,
      data: availableDates
    })
    
  } catch (error) {
    console.error('Error fetching available dates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available dates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await dbConnect()
    
    const body = await request.json()
    const { date, normalSlots, emergencySlots, emergencySlotCost, isAvailable } = body
    
    // Check if date already exists
    const existingDate = await AvailableDate.findOne({ date: new Date(date) })
    
    if (existingDate) {
      return NextResponse.json(
        { success: false, error: 'Date already exists' },
        { status: 400 }
      )
    }
    
    const newAvailableDate = new AvailableDate({
      date: new Date(date),
      normalSlots: normalSlots !== undefined ? normalSlots : 4,
      emergencySlots: emergencySlots !== undefined ? emergencySlots : 1,
      emergencySlotCost: emergencySlotCost !== undefined ? emergencySlotCost : 0,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    })
    
    await newAvailableDate.save()
    
    return NextResponse.json({
      success: true,
      data: newAvailableDate
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating available date:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create available date' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await dbConnect()
    
    const body = await request.json()
    const { dates } = body // Array of date objects to update/create
    
    if (!Array.isArray(dates)) {
      return NextResponse.json(
        { success: false, error: 'Dates should be an array' },
        { status: 400 }
      )
    }
    
    const results = []
    
    for (const dateData of dates) {
      const { date, normalSlots, emergencySlots, emergencySlotCost, isAvailable } = dateData
      
      const updatedDate = await AvailableDate.findOneAndUpdate(
        { date: new Date(date) },
        {
          normalSlots: normalSlots !== undefined ? normalSlots : 4,
          emergencySlots: emergencySlots !== undefined ? emergencySlots : 1,
          emergencySlotCost: emergencySlotCost !== undefined ? emergencySlotCost : 0,
          isAvailable: isAvailable !== undefined ? isAvailable : true
        },
        { 
          new: true, 
          upsert: true, // Create if doesn't exist
          runValidators: true 
        }
      )
      
      results.push(updatedDate)
    }
    
    return NextResponse.json({
      success: true,
      data: results
    })
    
  } catch (error) {
    console.error('Error updating available dates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update available dates' },
      { status: 500 }
    )
  }
}