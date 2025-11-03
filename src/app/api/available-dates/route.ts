export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import AvailableDate from '@/models/AvailableDate'

// GET /api/available-dates - Public endpoint for fetching available dates
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    
    let query = {}
    
    if (month && year) {
      // Use UTC to create date range to avoid timezone issues
      // This ensures consistent behavior across different server timezones
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
    
    // Only return available dates (isAvailable: true)
    const availableDates = await AvailableDate.find({
      ...query,
      isAvailable: true
    })
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