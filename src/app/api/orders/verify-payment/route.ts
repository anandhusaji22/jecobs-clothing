import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import AvailableDate from '@/models/AvailableDate';
import User from '@/models/User';
import SavedPayment from '@/models/SavedPayment';
import crypto from 'crypto';
import { sendOrderConfirmationEmail } from '@/lib/emailService';
import { format } from 'date-fns';
import { auth } from '@/lib/firebase/admin';

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

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { 
      orderId, 
      razorpayPaymentId, 
      razorpayOrderId, 
      razorpaySignature,
      paymentMethod
    } = await request.json();

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      // Payment signature invalid - mark as failed
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        order.updatedAt = new Date();
        await order.save();
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order with payment details
    order.paymentStatus = 'completed';
    order.status = 'confirmed';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentCompletedAt = new Date();
    order.updatedAt = new Date();

    await order.save();

    // Save payment method if provided
    if (paymentMethod && userId) {
      try {
        await savePaymentMethod(userId, paymentMethod);
      } catch (error) {
        console.error('Failed to save payment method:', error);
        // Don't fail the entire request if saving payment method fails
      }
    }

    // Update slot availability in database
    await updateSlotAvailability(order.slotAllocation);

    // Get user details for email
    const user = await User.findOne({ firebaseUid: order.userFirebaseUid });
    
    // Send order confirmation email
    if (user && user.email) {
      try {
        // Format dates using UTC to avoid timezone issues
        const formatDateUTC = (dateString: string): string => {
          const date = new Date(dateString);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = monthNames[date.getUTCMonth()];
          const year = date.getUTCFullYear();
          return `${month} ${day}, ${year}`;
        };
        const deliveryDates = order.slotAllocation.map((slot: { date: { date: string } }) => 
          formatDateUTC(slot.date.date)
        );

        await sendOrderConfirmationEmail({
          customerName: user.name || 'Valued Customer',
          customerEmail: user.email,
          customerPhone: user.phoneNumber || 'Not provided',
          orderNumber: `#${order._id.toString().slice(-8).toUpperCase()}`,
          productName: order.productName,
          productImage: order.productImage,
          quantity: order.quantity,
          totalPrice: order.totalPrice,
          deliveryDates: deliveryDates,
          orderDate: format(new Date(order.createdAt), 'MMM dd, yyyy'),
          status: order.status
        });
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the entire request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed',
      data: {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (error: unknown) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}

// Update slot availability by reducing available slots
interface SlotAllocation {
  date: {
    _id: string;
    date: string;
  };
  normalSlotsUsed: number;
  emergencySlotsUsed: number;
}

async function updateSlotAvailability(slotAllocation: SlotAllocation[]) {
  try {
    for (const allocation of slotAllocation) {
      await AvailableDate.findByIdAndUpdate(
        allocation.date._id,
        {
          $inc: {
            normalBookedSlots: allocation.normalSlotsUsed,
            emergencyBookedSlots: allocation.emergencySlotsUsed
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`Updated slots for date ${allocation.date.date}: +${allocation.normalSlotsUsed} normal, +${allocation.emergencySlotsUsed} emergency`);
    }
  } catch (error) {
    console.error('Error updating slot availability:', error);
    throw error;
  }
}

// Save payment method to user's saved payments
interface PaymentMethodData {
  type: 'card' | 'upi' | 'netbanking' | 'wallet';
  card?: {
    last4: string;
    brand: string; // visa, mastercard, etc.
    network: string; // credit, debit
  };
  upi?: {
    vpa: string; // UPI ID
  };
  bank?: {
    name: string;
  };
  wallet?: {
    name: string; // paytm, phonepe, etc.
  };
}

async function savePaymentMethod(userId: string, paymentMethod: PaymentMethodData) {
  try {
    let displayName = '';
    const paymentData: {
      userId: string;
      userFirebaseUid: string;
      type: string;
      displayName: string;
      cardLast4?: string;
      cardBrand?: string;
      cardNetwork?: string;
      upiId?: string;
      bankName?: string;
      walletName?: string;
      lastUsedAt: Date;
      isDefault: boolean;
    } = {
      userId,
      userFirebaseUid: userId,
      type: paymentMethod.type,
      displayName: '',
      lastUsedAt: new Date(),
      isDefault: false
    };

    switch (paymentMethod.type) {
      case 'card':
        if (paymentMethod.card) {
          paymentData.cardLast4 = paymentMethod.card.last4;
          paymentData.cardBrand = paymentMethod.card.brand;
          paymentData.cardNetwork = paymentMethod.card.network;
          displayName = `${paymentMethod.card.brand} •••• ${paymentMethod.card.last4}`;
        }
        break;
      
      case 'upi':
        if (paymentMethod.upi) {
          paymentData.upiId = paymentMethod.upi.vpa;
          displayName = `UPI: ${paymentMethod.upi.vpa}`;
        }
        break;
      
      case 'netbanking':
        if (paymentMethod.bank) {
          paymentData.bankName = paymentMethod.bank.name;
          displayName = `Netbanking: ${paymentMethod.bank.name}`;
        }
        break;
      
      case 'wallet':
        if (paymentMethod.wallet) {
          paymentData.walletName = paymentMethod.wallet.name;
          displayName = `Wallet: ${paymentMethod.wallet.name}`;
        }
        break;
    }

    paymentData.displayName = displayName;

    // Check if this payment method already exists
    let existingPayment = null;
    
    if (paymentMethod.type === 'card' && paymentMethod.card) {
      existingPayment = await SavedPayment.findOne({
        userId,
        type: 'card',
        cardLast4: paymentMethod.card.last4,
        cardBrand: paymentMethod.card.brand
      });
    } else if (paymentMethod.type === 'upi' && paymentMethod.upi) {
      existingPayment = await SavedPayment.findOne({
        userId,
        type: 'upi',
        upiId: paymentMethod.upi.vpa
      });
    } else if (paymentMethod.type === 'netbanking' && paymentMethod.bank) {
      existingPayment = await SavedPayment.findOne({
        userId,
        type: 'netbanking',
        bankName: paymentMethod.bank.name
      });
    } else if (paymentMethod.type === 'wallet' && paymentMethod.wallet) {
      existingPayment = await SavedPayment.findOne({
        userId,
        type: 'wallet',
        walletName: paymentMethod.wallet.name
      });
    }

    if (existingPayment) {
      // Update last used date
      existingPayment.lastUsedAt = new Date();
      await existingPayment.save();
      console.log('Updated existing payment method');
    } else {
      // Check if this is the user's first payment method
      const paymentCount = await SavedPayment.countDocuments({ userId });
      if (paymentCount === 0) {
        paymentData.isDefault = true;
      }
      
      // Create new saved payment
      await SavedPayment.create(paymentData);
      console.log('Saved new payment method');
    }
  } catch (error) {
    console.error('Error saving payment method:', error);
    throw error;
  }
}