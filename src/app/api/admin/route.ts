import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { requireAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/db';



export async function GET(request: NextRequest) {
  try {
    // This will throw an error if the user is not authenticated or not an admin
    const authRequest = await requireAdmin(request);
    
    // If we get here, the user is authenticated AND is an admin
    return NextResponse.json({
      message: 'Welcome to the admin API!',
      user: authRequest.user,
      adminData: {
        totalUsers: 1234,
        totalOrders: 5678,
        revenue: 89123,
        recentActivity: [
          'New user registered: john@example.com',
          'Order #12345 completed',
          'Product "Sacred Vestment" updated',
        ]
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    if (errorMessage.includes('Admin access required')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authRequest = await requireAdmin(request);
    const body = await request.json();
    
    // Admin action - could be creating users, products, etc.
    return NextResponse.json({
      message: 'Admin action completed successfully',
      action: body.action,
      performedBy: authRequest.user?.name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    if (errorMessage.includes('Admin access required')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}