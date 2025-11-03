import { NextRequest, NextResponse } from 'next/server';
import Product from '@/models/Product';
import dbConnect from '@/lib/db';
import { auth } from '@/lib/firebase/admin';
import User from '@/models/User';

export const runtime = 'nodejs'

// Simple admin authentication helper
async function requireAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.split('Bearer ')[1];
  
  if (!auth) {
    throw new Error('Firebase Admin not configured');
  }

  const decodedToken = await auth.verifyIdToken(token);
  const user = await User.findOne({ firebaseUid: decodedToken.uid });
  
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}

// GET /api/products - Get all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const denomination = searchParams.get('denomination');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query filters
    const query: Record<string, unknown> = { isActive: true };

    if (denomination) {
      query.denomination = denomination;
    }

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      query['pricing.basePrice'] = priceFilter;
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
    const products = await Product.find()
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments();

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
        }
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch products' 
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdminAuth(request);
    
    await dbConnect();

    const body = await request.json();
    
    // Debug: Log the incoming request body
    console.log('=== INCOMING REQUEST BODY ===');
    console.log(JSON.stringify(body, null, 2));
    console.log('showClothsProvided in body:', body.showClothsProvided);
    console.log('showClothsProvided type:', typeof body.showClothsProvided);
    console.log('=============================');
    
    const {
      name: nameField,
      Name: NameField,
      description,
      pricing,
      denomination,
      images,
      showClothsProvided = true,
      colors,
      isActive = true,
    } = body;
    
    // Handle both 'name' and 'Name' field variations
    const name = nameField || NameField;
    
    // Debug: Log the parsed pricing structure
    console.log('=== PARSED PRICING ===');
    console.log(JSON.stringify(pricing, null, 2));
    console.log('====================');

    // Validation - allow empty images for initial creation, will be updated later
    if (!name || !description || !pricing || !denomination) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name, description, pricing, and denomination are required' 
        },
        { status: 400 }
      );
    }

    if (!pricing.basePrice || pricing.basePrice < 0) {
      return NextResponse.json(
        { success: false, error: 'Base price must be a positive number' },
        { status: 400 }
      );
    }

    if (!pricing.clothType  || !pricing.clothType.materials?.length) {
      return NextResponse.json(
        { success: false, error: 'Cloth type with at least one material is required' },
        { status: 400 }
      );
    }


    // Validate colors if provided
    if (colors && colors.length > 0) {
      for (const color of colors) {
        if (!color.color || !color.colorCode || !/^#[0-9A-F]{6}$/i.test(color.colorCode)) {
          return NextResponse.json(
            { success: false, error: 'All colors must have valid color name and hex color code' },
            { status: 400 }
          );
        }
      }
    }

    // Create product
    console.log('=== CREATING PRODUCT WITH ===');
    console.log('showClothsProvided:', showClothsProvided);
    console.log('showClothsProvided type:', typeof showClothsProvided);
    console.log('=============================');
    
    const product = new Product({
      name: name.trim(),
      description,
      pricing,
      denomination,
      images,
      showClothsProvided,
      colors: colors || [],
      isActive,
    });

    const savedProduct = await product.save();

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Product POST error:', error);
    
    if (error instanceof Error && error.message.includes('E11000')) {
      return NextResponse.json(
        { success: false, error: 'Product with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create product' 
      },
      { status: 500 }
    );
  }
}