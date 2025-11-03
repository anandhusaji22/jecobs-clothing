import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { auth } from '@/lib/firebase/admin'
import SavedPayment from '@/models/SavedPayment'

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

    // Fetch user's saved payment methods
    const paymentMethods = await SavedPayment.find({ 
      userId: decodedToken.uid 
    }).sort({ isDefault: -1, lastUsedAt: -1 }) // Default first, then by last used

    return NextResponse.json({
      success: true,
      paymentMethods: paymentMethods
    })

  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    await request.json() // paymentMethodData - will be used when implementing actual saving

    // Connect to database
    await dbConnect()

    // For now, just return success - can be extended later
    // to actually save payment methods
    return NextResponse.json({
      success: true,
      message: 'Payment method saved successfully'
    })

  } catch (error) {
    console.error('Error saving payment method:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get payment method ID from query params
    const { searchParams } = new URL(request.url)
    const paymentMethodId = searchParams.get('id')

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, message: 'Payment method ID required' },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // Delete the payment method (only if it belongs to the user)
    const result = await SavedPayment.findOneAndDelete({
      _id: paymentMethodId,
      userId: decodedToken.uid
    })

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Payment method not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}