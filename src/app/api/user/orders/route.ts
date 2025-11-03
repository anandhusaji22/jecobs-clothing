import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import { auth } from '@/lib/firebase/admin'

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Connect to database
    await dbConnect()

    // Find all orders for the user, sorted by creation date (newest first)
    const orders = await Order.find({
      userFirebaseUid: decodedToken.uid
    }).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      orders: orders
    })

  } catch (error) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}