export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import { requireAdmin } from '@/lib/auth-helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDocument = any

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await connectToDatabase()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(today.getDate() + 3)
    threeDaysFromNow.setHours(23, 59, 59, 999) // End of day 3 days from now
    
    // Get only PENDING orders that need attention (exclude cancelled and completed)
    const orders = await Order.find({
      status: { 
        $nin: ['cancelled', 'canceled', 'completed', 'delivered'] 
      }
    })
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
    
    const notifications: Array<{
      id: string
      type: 'urgent' | 'warning' | 'info'
      title: string
      message: string
      orderId: string
      daysLeft: number
      status: string
    }> = []
    
    orders.forEach(order => {
      if (!order.slotAllocation || order.slotAllocation.length === 0) return
      
      // Skip if order is cancelled or completed
      const orderStatus = (order.status || '').toLowerCase()
      if (orderStatus === 'cancelled' || orderStatus === 'canceled' || 
          orderStatus === 'completed' || orderStatus === 'delivered') {
        return
      }
      
      const earliestDeliveryDate = new Date(order.slotAllocation[0].date.date)
      earliestDeliveryDate.setHours(0, 0, 0, 0) // Start of delivery day
      
      const diffTime = earliestDeliveryDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      const user = userMap.get(order.userFirebaseUid)
      const customerName = user?.name || 'Unknown Customer'  
      const orderDoc = order as AnyDocument
      const orderShortId = orderDoc._id.toString().slice(-6)
      
      // Overdue orders (past delivery date and still pending)
      if (diffDays < 0 && orderStatus === 'pending') {
        notifications.push({
          id: `overdue-${orderDoc._id}`,
          type: 'urgent',
          title: `Order #${orderShortId} is ${Math.abs(diffDays)} day(s) overdue`,
          message: `${customerName} - ${order.productName}`,
          orderId: orderDoc._id.toString(),
          daysLeft: diffDays,
          status: 'Overdue'
        })
      }
      // Orders due in 1-3 days (warning)
      else if (diffDays >= 0 && diffDays <= 3 && orderStatus === 'pending') {
        const urgencyType = diffDays === 0 ? 'urgent' : 'warning'
        const dayText = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`
        
        notifications.push({
          id: `pending-${orderDoc._id}`,
          type: urgencyType,
          title: `Order #${orderShortId} - Due ${dayText}`,
          message: `${customerName} - ${order.productName}`,
          orderId: orderDoc._id.toString(),
          daysLeft: diffDays,
          status: diffDays === 0 ? 'Due Today' : `${diffDays} day(s) left`
        })
      }
    })
    
    // Sort notifications by urgency (overdue first, then by days left)
    notifications.sort((a, b) => {
      if (a.type === 'urgent' && b.type !== 'urgent') return -1
      if (b.type === 'urgent' && a.type !== 'urgent') return 1
      if (a.type === 'warning' && b.type === 'info') return -1
      if (b.type === 'warning' && a.type === 'info') return 1
      return a.daysLeft - b.daysLeft
    })
    
    return NextResponse.json({
      success: true,
      notifications: notifications.slice(0, 20) // Limit to 20 most urgent
    })
    
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}