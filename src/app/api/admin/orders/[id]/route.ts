export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import AvailableDate from '@/models/AvailableDate'
import { sendOrderStatusUpdateEmail } from '@/lib/emailService'
import { requireAdmin } from '@/lib/auth-helpers'

// Update slot availability when payment is confirmed (same logic as verify-payment)
async function updateSlotAvailability(slotAllocation: Array<{ date: { _id: string }; normalSlotsUsed: number; emergencySlotsUsed: number }>) {
  if (!slotAllocation?.length) return
  for (const allocation of slotAllocation) {
    await AvailableDate.findByIdAndUpdate(allocation.date._id, {
      $inc: {
        normalBookedSlots: allocation.normalSlotsUsed,
        emergencyBookedSlots: allocation.emergencySlotsUsed
      },
      $set: { updatedAt: new Date() }
    })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is an admin
    await requireAdmin(request);
    
    await connectToDatabase()
    
    const { status, paymentStatus } = await request.json()
    const { id: orderId } = await params
    
    if (!status && !paymentStatus) {
      return NextResponse.json(
        { success: false, error: 'Status or paymentStatus is required' },
        { status: 400 }
      )
    }
    
    // Fetch current order to check if we're newly confirming payment (for slot update)
    const currentOrder = await Order.findById(orderId)
    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Build update object
    const updateData: { status?: string; paymentStatus?: string; paymentCompletedAt?: Date } = {}
    if (status) {
      updateData.status = status
    }
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
      // Set paymentCompletedAt if payment is completed
      if (paymentStatus === 'completed') {
        updateData.paymentCompletedAt = new Date()
      }
    }
    
    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    )
    
    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // When admin sets payment to "completed", apply order's slots to AvailableDate (update booked counts)
    if (paymentStatus === 'completed' && currentOrder.paymentStatus !== 'completed') {
      try {
        await updateSlotAvailability(updatedOrder.slotAllocation)
      } catch (slotError) {
        console.error('Failed to update slot availability after payment confirm:', slotError)
        // Don't fail the API – order and payment are already updated
      }
    }
    
    // Get user details for email (only send email if order status changed)
    if (status) {
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