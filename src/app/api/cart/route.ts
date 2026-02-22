import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Cart, { ICartItem } from '@/models/Cart';
import { auth } from '@/lib/firebase/admin';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  if (token.startsWith('email-') && token.length > 20) {
    const uid = request.headers.get('x-user-id');
    return uid?.trim() || null;
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    return null;
  }
}

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({
        userId,
        userFirebaseUid: userId,
        items: [],
      });
    }

    return NextResponse.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { item } = body;

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item data is required' },
        { status: 400 }
      );
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        userFirebaseUid: userId,
        items: [item],
      });
    } else {
      // Add new item to cart
      cart.items.push(item);
      await cart.save();
    }

    return NextResponse.json({
      success: true,
      data: cart,
      message: 'Item added to cart successfully',
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// PUT /api/cart - Update cart (update item or delivery address)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { itemId, quantity, deliveryAddress } = body;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Update delivery address if provided
    if (deliveryAddress !== undefined) {
      cart.deliveryAddress = deliveryAddress;
    }

    // Update item quantity if itemId and quantity provided
    if (itemId && quantity !== undefined) {
      type CartItemWithId = ICartItem & { _id: { toString: () => string } };
      const itemIndex = cart.items.findIndex(
        (item: CartItemWithId) => item._id.toString() === itemId
      );

      if (itemIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'Item not found in cart' },
          { status: 404 }
        );
      }

      if (quantity === 0) {
        // Remove item if quantity is 0
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart.items[itemIndex].quantity = quantity;
        // Recalculate total price based on quantity
        const item = cart.items[itemIndex];
        const pricePerUnit = item.totalPrice / item.quantity;
        item.totalPrice = pricePerUnit * quantity;
      }
    }

    await cart.save();

    return NextResponse.json({
      success: true,
      data: cart,
      message: 'Cart updated successfully',
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Remove item from cart or clear cart
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const clearCart = searchParams.get('clearCart') === 'true';

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      );
    }

    if (clearCart) {
      // Clear all items
      cart.items = [];
    } else if (itemId) {
      // Remove specific item
      type CartItemWithId = ICartItem & { _id: { toString: () => string } };
      const itemIndex = cart.items.findIndex(
        (item: CartItemWithId) => item._id.toString() === itemId
      );

      if (itemIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'Item not found in cart' },
          { status: 404 }
        );
      }

      cart.items.splice(itemIndex, 1);
    } else {
      return NextResponse.json(
        { success: false, error: 'ItemId or clearCart parameter required' },
        { status: 400 }
      );
    }

    await cart.save();

    return NextResponse.json({
      success: true,
      data: cart,
      message: clearCart ? 'Cart cleared successfully' : 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error deleting from cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete from cart' },
      { status: 500 }
    );
  }
}
