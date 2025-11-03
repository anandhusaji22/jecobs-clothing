export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import AvailableDate from '@/models/AvailableDate'

export async function DELETE(request: NextRequest) {
  try {
    // Remove admin requirement since this is called from public product pages
    
    await dbConnect()
    
    const body = await request.json()
    const { beforeDate } = body
    
    if (!beforeDate) {
      return NextResponse.json(
        { success: false, error: 'beforeDate is required' },
        { status: 400 }
      )
    }
    
    // Delete all dates before the specified date
    const result = await AvailableDate.deleteMany({
      date: { $lt: new Date(beforeDate) }
    })
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} past dates`,
      deletedCount: result.deletedCount
    })
    
  } catch (error) {
    console.error('Error cleaning up past dates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup past dates' },
      { status: 500 }
    )
  }
}