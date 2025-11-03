import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { auth } from '@/lib/firebase/admin';

// Handle payment failure
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { orderId, orderIds, error: paymentError } = await request.json();

    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    await auth.verifyIdToken(token);

    // Handle multiple orders (cart checkout) or single order
    if (orderIds && Array.isArray(orderIds)) {
      // Update multiple orders
      const result = await Order.updateMany(
        { _id: { $in: orderIds } },
        {
          $set: {
            paymentStatus: 'failed',
            status: 'cancelled',
            updatedAt: new Date()
          }
        }
      );

      console.log(`${result.modifiedCount} orders marked as cancelled due to payment failure:`, paymentError);

      return NextResponse.json({
        success: true,
        message: 'Orders cancelled due to payment failure',
        data: {
          orderIds: orderIds,
          count: result.modifiedCount,
          status: 'cancelled',
          paymentStatus: 'failed'
        }
      });
    } else {
      // Handle single order
      const order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      // Update order status to cancelled and payment failed
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.updatedAt = new Date();

      await order.save();

      console.log(`Order ${orderId} marked as cancelled due to payment failure:`, paymentError);

      return NextResponse.json({
        success: true,
        message: 'Order cancelled due to payment failure',
        data: {
          orderId: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus
        }
      });
    }
  } catch (error: unknown) {
    console.error('Payment failure handler error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle payment failure' },
      { status: 500 }
    );
  }
}
