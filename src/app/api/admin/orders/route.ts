export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await connectToDatabase()
    
    // Fetch all orders with user details
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .lean()
    
    // Get unique user Firebase UIDs from orders
    const userFirebaseUids = [...new Set(orders.map(order => order.userFirebaseUid))]
    
    // Fetch user details for all orders
    const users = await User.find({ 
      firebaseUid: { $in: userFirebaseUids } 
    }).lean()
    
    // Create a map for quick user lookup
    const userMap = new Map()
    users.forEach(user => {
      userMap.set(user.firebaseUid, user)
    })
    
    // Add user details to orders
    const ordersWithUsers = orders.map(order => ({
      ...order,
      user: userMap.get(order.userFirebaseUid)
    }))
    
    return NextResponse.json({
      success: true,
      orders: ordersWithUsers
    })
  } catch (error) {
    console.error('Error fetching admin orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}