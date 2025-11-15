export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db'
import User from '@/models/User'
import Order from '@/models/Order'
import UserSize from '@/models/UserSize'
import UserAddress from '@/models/UserAddress'
import { requireAdmin } from '@/lib/auth-helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDocument = any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await connectToDatabase()
    
    const { id: userId } = await params
    
    // Get user details
    const user = await User.findById(userId).lean() as AnyDocument
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Get user's saved addresses
    const userAddresses = await UserAddress.find({ 
      userId: user.firebaseUid 
    }).lean()
    
    // Get user's saved sizes
    const savedSizes = await UserSize.find({ 
      userId: user.firebaseUid 
    }).lean()
    
    // Get user's order history
    const orders = await Order.find({ 
      userFirebaseUid: user.firebaseUid 
    })
    .select('productName status createdAt slotAllocation totalPrice')
    .sort({ createdAt: -1 })
    .lean()
    
    const formattedOrders = orders.map((order: AnyDocument) => ({
      _id: order._id?.toString() || '',
      dressType: order.productName || 'N/A',
      deliveryDate: order.slotAllocation && order.slotAllocation.length > 0 
        ? new Date(order.slotAllocation[0].date.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : 'N/A',
      status: order.status || 'Pending',
      amount: order.totalPrice || 0
    }))
    
    const userDetails = {
      _id: user._id?.toString() || '',
      name: user.name || 'N/A',
      email: user.email || 'N/A',
      phoneNumber: user.phoneNumber || 'N/A',
      address: userAddresses && userAddresses.length > 0 
        ? `${userAddresses[0].street}, ${userAddresses[0].city}, ${userAddresses[0].state} ${userAddresses[0].zipCode}` 
        : 'N/A',
      savedSizes: savedSizes.map((size: AnyDocument) => ({
        _id: size._id?.toString() || '',
        name: size.name || 'Unnamed Size',
        category: size.type || 'Unknown',
        chest: size.measurements?.chest || 'N/A',
        length: size.measurements?.length || 'N/A',
        shoulders: size.measurements?.shoulders || 'N/A',
        sleeves: size.measurements?.sleeves || 'N/A',
        neck: size.measurements?.neck || 'N/A',
        waist: size.measurements?.waist || 'N/A',
        backPleatLength: size.measurements?.backPleatLength || ''
      })),
      orderHistory: formattedOrders
    }
    
    return NextResponse.json({
      success: true,
      user: userDetails
    })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    await connectToDatabase()

    const { id: userId } = await params
    const body = await request.json()
    const { sizeId, name, category, measurements } = body as {
      sizeId?: string
      name?: string
      category?: string
      measurements?: {
        chest?: string
        length?: string
        shoulders?: string
        sleeves?: string
        neck?: string
        waist?: string
        backPleatLength?: string
      }
    }

    if (!sizeId || !name || !measurements) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const user = await User.findById(userId).lean() as AnyDocument

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const existingSize = await UserSize.findOne({
      _id: sizeId,
      userId: user.firebaseUid
    })

    if (!existingSize) {
      return NextResponse.json(
        { success: false, error: 'Size not found for this user' },
        { status: 404 }
      )
    }

    existingSize.name = name.trim()
    existingSize.type = (category?.trim() || existingSize.type || 'general')
    existingSize.measurements = {
      chest: measurements.chest?.trim() || '',
      length: measurements.length?.trim() || '',
      shoulders: measurements.shoulders?.trim() || '',
      sleeves: measurements.sleeves?.trim() || '',
      neck: measurements.neck?.trim() || '',
      waist: measurements.waist?.trim() || '',
      backPleatLength: measurements.backPleatLength?.trim() || ''
    }

    await existingSize.save()

    return NextResponse.json({
      success: true,
      message: 'Measurements updated successfully'
    })
  } catch (error) {
    console.error('Error updating user measurements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update measurements' },
      { status: 500 }
    )
  }
}