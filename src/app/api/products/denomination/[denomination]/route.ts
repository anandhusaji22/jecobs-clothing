import { NextRequest, NextResponse } from 'next/server';
import Product from '@/models/Product';
import dbConnect from '@/lib/db';
export const runtime = 'nodejs';

// GET /api/products/denomination/[denomination] - Get products by denomination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ denomination: string }> }
) {
  try {
    await dbConnect();

    const { denomination } = await params;
    const { searchParams } = new URL(request.url);
    

    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build query filters
    const query: Record<string, unknown> = { 
      denomination: decodeURIComponent(denomination)
    };

    // Only show active products to public users
    if (!includeInactive) {
      query.isActive = true;
    }

   

    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Get available price range for this denomination
    const priceStats = await Product.aggregate([
      { $match: { denomination: decodeURIComponent(denomination), isActive: true } },

    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        denomination: decodeURIComponent(denomination),
        priceRange: priceStats.length > 0 ? priceStats[0] : null
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Products by denomination GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch products' 
      },
      { status: 500 }
    );
  }
}