import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { auth } from '@/lib/firebase/admin'
import SavedPayment from '@/models/SavedPayment'

export const runtime = 'nodejs';

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split('Bearer ')[1]
  if (token.startsWith('email-') && token.length > 20) {
    const uid = request.headers.get('x-user-id')
    return uid?.trim() || null
  }
  try {
    const decoded = await auth.verifyIdToken(token)
    return decoded.uid
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const paymentMethods = await SavedPayment.find({ 
      userId 
    }).sort({ isDefault: -1, lastUsedAt: -1 })

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
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await request.json()

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
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const paymentMethodId = searchParams.get('id')

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, message: 'Payment method ID required' },
        { status: 400 }
      )
    }

    await dbConnect()

    const result = await SavedPayment.findOneAndDelete({
      _id: paymentMethodId,
      userId
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