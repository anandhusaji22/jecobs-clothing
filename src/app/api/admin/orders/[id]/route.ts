export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import { sendOrderStatusUpdateEmail } from '@/lib/emailService'
import { requireAdmin } from '@/lib/auth-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await connectToDatabase()
    
    const { status } = await request.json()
    const { id: orderId } = await params
    
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }
    
    // Update the order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    )
    
    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Get user details for email
    const user = await User.findOne({ 
      firebaseUid: updatedOrder.userFirebaseUid 
    })
    
    // Send status update email if user found
    if (user && user.email) {
      try {
        const deliveryDates = updatedOrder.slotAllocation.map((slot: { date: { date: string } }) => 
          new Date(slot.date.date).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        )
        
        await sendOrderStatusUpdateEmail({
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.phoneNumber || '',
          orderNumber: `#${updatedOrder._id.toString().slice(-6)}`,
          productName: updatedOrder.productName,
          productImage: updatedOrder.productImage || '',
          quantity: updatedOrder.quantity,
          totalPrice: updatedOrder.totalPrice,
          deliveryDates,
          orderDate: new Date(updatedOrder.createdAt).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          status
        })
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError)
        // Don't fail the API call if email fails
      }
    }
    
    return NextResponse.json({
      success: true,
      order: updatedOrder
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}