import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Cart, { ICartItem } from '@/models/Cart';
import AvailableDate from '@/models/AvailableDate';
import { verifyIdToken } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

// Create orders from cart items and initiate Razorpay payment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    
    // Extract auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    if (!cart.deliveryAddress) {
      return NextResponse.json(
        { success: false, error: 'Delivery address not set' },
        { status: 400 }
      );
    }

    // Calculate total amount for all items
    const totalAmount = cart.items.reduce((sum: number, item: ICartItem) => sum + item.totalPrice, 0);

    // STEP 1: Validate slot availability BEFORE creating any orders
    // This ensures we don't create orders if slots are insufficient
    const slotValidation = await validateCartSlotAvailability(cart.items);
    if (!slotValidation.valid) {
      return NextResponse.json(
        { success: false, error: slotValidation.error },
        { status: 400 }
      );
    }

    // Create orders for each cart item
    const orderIds: string[] = [];
    const createdOrders = [];

    for (const item of cart.items) {
      // Fetch actual available dates from database using UTC to avoid timezone issues
      const datePromises = item.selectedDates.map(async (dateStr: Date) => {
        const date = new Date(dateStr);
        // Use UTC to create date range for consistent querying
        const startDate = new Date(Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          0, 0, 0, 0
        ));
        const endDate = new Date(Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          23, 59, 59, 999
        ));
        const dateData = await AvailableDate.findOne({
          date: {
            $gte: startDate,
            $lte: endDate
          }
        });
        return dateData;
      });

      const availableDates = await Promise.all(datePromises);
      
      // Construct slot allocation with actual date data
      const slotAllocation = availableDates.map((dateData, index) => {
        if (!dateData) {
          throw new Error(`Available date not found for ${item.selectedDates[index]}`);
        }
        
        // Calculate slots per date (distributed evenly across selected dates)
        const normalSlotsPerDate = Math.floor(item.normalSlotsTotal / item.selectedDates.length);
        const emergencySlotsPerDate = Math.floor(item.emergencySlotsTotal / item.selectedDates.length);
        const totalSlotsPerDate = normalSlotsPerDate + emergencySlotsPerDate;
        
        return {
          date: {
            _id: dateData._id.toString(),
            date: dateData.date.toISOString(),
            normalSlots: dateData.normalSlots,
            emergencySlots: dateData.emergencySlots,
            isAvailable: dateData.isAvailable,
            normalBookedSlots: dateData.normalBookedSlots,
            emergencyBookedSlots: dateData.emergencyBookedSlots
          },
          normalSlotsUsed: normalSlotsPerDate,
          emergencySlotsUsed: emergencySlotsPerDate,
          totalSlotsUsed: totalSlotsPerDate
        };
      });

      const orderData = {
        // Product details
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        productDescription: item.productDescription,
        
        // User details
        userId: userId,
        userFirebaseUid: userId,
        
        // Order details
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        size: item.size,
        material: item.material,
        specialNotes: item.specialNotes,
        clothesProvided: item.clothesProvided,
        deliveryAddress: cart.deliveryAddress,
        
        // Slot allocation with actual date data
        slotAllocation: slotAllocation,
        normalSlotsTotal: item.normalSlotsTotal,
        emergencySlotsTotal: item.emergencySlotsTotal,
        
        // Price breakdown
        priceBreakdown: {
          basePrice: item.basePrice,
          normalSlotsCost: item.normalSlotsCost,
          emergencySlotsCost: item.emergencySlotsCost,
          emergencyCharges: item.emergencyCharges
        },
        
        selectedDates: item.selectedDates,
        
        // Payment details
        paymentMethodId: body.paymentMethodId,
        
        // Order status
        status: 'pending',
        paymentStatus: 'pending',
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();
      orderIds.push(savedOrder._id.toString());
      createdOrders.push(savedOrder);
    }

    // Initialize Razorpay order for combined total
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: `cart_${Date.now()}`,
      notes: {
        orderIds: orderIds.join(','),
        itemCount: cart.items.length.toString(),
        userId: userId
      }
    });

    // Update all orders with Razorpay order ID
    for (const order of createdOrders) {
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        orderIds: orderIds,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        itemCount: cart.items.length
      }
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Cart order creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create orders from cart';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Validate slot availability for all cart items before creating orders
async function validateCartSlotAvailability(cartItems: ICartItem[]) {
  try {
    // Group all slot allocations by date ID
    const dateSlotMap = new Map<string, { normalSlots: number; emergencySlots: number; dateId: string; dateString: string }>();
    
    // Process each cart item
    for (const item of cartItems) {
      // Fetch available dates for this item
      const datePromises = item.selectedDates.map(async (dateStr: Date) => {
        const date = new Date(dateStr);
        const startDate = new Date(Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          0, 0, 0, 0
        ));
        const endDate = new Date(Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          23, 59, 59, 999
        ));
        const dateData = await AvailableDate.findOne({
          date: {
            $gte: startDate,
            $lte: endDate
          }
        });
        return dateData;
      });

      const availableDates = await Promise.all(datePromises);
      
      // Calculate slots needed per date for this item
      const normalSlotsPerDate = Math.floor(item.normalSlotsTotal / item.selectedDates.length);
      const emergencySlotsPerDate = Math.floor(item.emergencySlotsTotal / item.selectedDates.length);
      
      // Accumulate slots needed per date
      for (let i = 0; i < availableDates.length; i++) {
        const dateData = availableDates[i];
        if (!dateData) {
          return {
            valid: false,
            error: `Date ${item.selectedDates[i]} is no longer available`
          };
        }
        
        // Check if date is available
        if (!dateData.isAvailable) {
          return {
            valid: false,
            error: `Date ${dateData.date.toISOString().split('T')[0]} is not available for booking`
          };
        }
        
        const dateId = dateData._id.toString();
        const existing = dateSlotMap.get(dateId);
        
        if (existing) {
          // Add to existing slots needed for this date
          existing.normalSlots += normalSlotsPerDate;
          existing.emergencySlots += emergencySlotsPerDate;
        } else {
          // Initialize for this date
          dateSlotMap.set(dateId, {
            normalSlots: normalSlotsPerDate,
            emergencySlots: emergencySlotsPerDate,
            dateId: dateId,
            dateString: dateData.date.toISOString()
          });
        }
      }
    }
    
    // Now validate that all dates have enough available slots
    for (const [dateId, slotsNeeded] of dateSlotMap) {
      const dateDoc = await AvailableDate.findById(dateId);
      
      if (!dateDoc) {
        return {
          valid: false,
          error: `Date ${slotsNeeded.dateString} is no longer available`
        };
      }
      
      // Check if date is still available
      if (!dateDoc.isAvailable) {
        return {
          valid: false,
          error: `Date ${slotsNeeded.dateString} is not available for booking`
        };
      }
      
      const availableNormalSlots = dateDoc.normalSlots - dateDoc.normalBookedSlots;
      const availableEmergencySlots = dateDoc.emergencySlots - dateDoc.emergencyBookedSlots;
      
      if (slotsNeeded.normalSlots > availableNormalSlots) {
        const dateStr = new Date(slotsNeeded.dateString).toISOString().split('T')[0];
        return {
          valid: false,
          error: `Not enough normal slots available for ${dateStr}. Available: ${availableNormalSlots}, Required: ${slotsNeeded.normalSlots}`
        };
      }
      
      if (slotsNeeded.emergencySlots > availableEmergencySlots) {
        const dateStr = new Date(slotsNeeded.dateString).toISOString().split('T')[0];
        return {
          valid: false,
          error: `Not enough emergency slots available for ${dateStr}. Available: ${availableEmergencySlots}, Required: ${slotsNeeded.emergencySlots}`
        };
      }
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Cart slot validation error:', error);
    return {
      valid: false,
      error: 'Failed to validate slot availability'
    };
  }
}
