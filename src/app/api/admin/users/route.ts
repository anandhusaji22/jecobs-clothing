export const runtime = 'nodejs';  
import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db'
import User from '@/models/User'
import Order from '@/models/Order'
import UserAddress from '@/models/UserAddress'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await connectToDatabase()
    
    // Fetch all users
    const users = await User.find({})
      .select('name email phoneNumber firebaseUid createdAt')
      .sort({ createdAt: -1 })
      .lean()
    
    // Get order counts and addresses for each user
    const usersWithOrderCounts = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ 
          userFirebaseUid: user.firebaseUid 
        })
        
        // Get user's default address or first address
        const userAddress = await UserAddress.findOne({ 
          userId: user.firebaseUid 
        }).sort({ isDefault: -1, createdAt: -1 })
        
        const addressString = userAddress 
          ? `${userAddress.street}, ${userAddress.city}, ${userAddress.state} ${userAddress.zipCode}`
          : 'N/A'
        
        return {
          _id: user._id?.toString() || '',
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber || 'N/A',
          firebaseUid: user.firebaseUid,
          address: addressString,
          orders: orderCount,
          createdAt: user.createdAt
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      users: usersWithOrderCounts
    })
    
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}