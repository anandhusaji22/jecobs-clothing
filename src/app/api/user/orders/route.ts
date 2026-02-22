import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import { auth } from '@/lib/firebase/admin'

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let userUid: string

    // Email-login token (no Firebase): use X-User-Id header set by client
    if (token.startsWith('email-') && token.length > 20) {
      const uidFromHeader = request.headers.get('x-user-id')
      if (!uidFromHeader?.trim()) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }
      userUid = uidFromHeader.trim()
    } else {
      const decodedToken = await auth.verifyIdToken(token)
      if (!decodedToken) {
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 }
        )
      }
      userUid = decodedToken.uid
    }

    await dbConnect()

    const orders = await Order.find({
      userFirebaseUid: userUid
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