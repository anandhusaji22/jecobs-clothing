import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { auth } from '@/lib/firebase/admin';
import User from '@/models/User';
import AvailableDate from '@/models/AvailableDate';

export const runtime = 'nodejs';

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  if (token.startsWith('email-') && token.length > 20) {
    const uid = request.headers.get('x-user-id');
    return uid?.trim() || null;
  }
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// Create order and initiate Razorpay payment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const user = await User.findOne({
      $or: [{ firebaseUid: userId }, { _id: userId }]
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate slot availability before creating order
    const slotValidation = await validateSlotAvailability(body.slotAllocation);
    if (!slotValidation.valid) {
      return NextResponse.json(
        { success: false, error: slotValidation.error },
        { status: 400 }
      );
    }

    const orderData = {
      ...body,
      userId: user._id,
      userFirebaseUid: user.firebaseUid || userId,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();

    // Initialize Razorpay order
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(body.totalPrice * 100), // Amount in paise
      currency: 'INR',
      receipt: `order_${savedOrder._id}`,
      notes: {
        orderId: savedOrder._id.toString(),
        productName: body.productName,
        quantity: body.quantity.toString()
      }
    });

    // Update order with Razorpay order ID
    savedOrder.razorpayOrderId = razorpayOrder.id;
    await savedOrder.save();

    return NextResponse.json({
      success: true,
      data: {
        orderId: savedOrder._id,
        razorpayOrderId: razorpayOrder.id,
        amount: body.totalPrice
      }
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Validate that slots are still available
interface SlotAllocation {
  date: {
    _id: string;
    date: string;
  };
  normalSlotsUsed: number;
  emergencySlotsUsed: number;
}

async function validateSlotAvailability(slotAllocation: SlotAllocation[]) {
  try {
    for (const allocation of slotAllocation) {
      const dateDoc = await AvailableDate.findById(allocation.date._id);
      
      if (!dateDoc) {
        return {
          valid: false,
          error: `Date ${allocation.date.date} is no longer available`
        };
      }

      const availableNormalSlots = dateDoc.normalSlots - dateDoc.normalBookedSlots;
      const availableEmergencySlots = dateDoc.emergencySlots - dateDoc.emergencyBookedSlots;

      if (allocation.normalSlotsUsed > availableNormalSlots) {
        return {
          valid: false,
          error: `Not enough slots available for ${allocation.date.date} Please select a different date`
        };
      }

      if (allocation.emergencySlotsUsed > availableEmergencySlots) {
        return {
          valid: false,
          error: `Not enough slots available for ${allocation.date.date} Please select a different date or reduce the quantity`
        };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('Slot validation error:', error);
    return {
      valid: false,
      error: 'Failed to validate slot availability'
    };
  }
}