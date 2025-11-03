import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    
    // Connect to database
    await dbConnect()
    console.log('Database connected successfully')

    // Count total orders
    const orderCount = await Order.countDocuments()
    console.log(`Total orders in database: ${orderCount}`)

    // Get recent orders (limit 5)
    const recentOrders = await Order.find()
      .select('_id orderNumber userId createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
    
    console.log('Recent orders:', recentOrders)

    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      data: {
        orderCount,
        recentOrders
      }
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}