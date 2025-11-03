import { NextRequest, NextResponse } from 'next/server';
import Product from '@/models/Product';
import dbConnect from '@/lib/db';
import { auth } from '@/lib/firebase/admin';
import User from '@/models/User';
import { S3Service } from '@/lib/s3Service';

export const runtime = 'nodejs';

interface ProductDocument {
  _id: string;
  name: string;
  description: string;
  pricing: {
    basePrice: number;
    clothProvidedDiscount: number;
    clothType: {
      name: string;
      description?: string;
      materials: Array<{
        name: string;
        additionalCost: number;
        isAvailable: boolean;
      }>;
    };
  };
  denomination: string;
  images: string[];
  showClothsProvided: boolean;
  colors: Array<{ color: string; colorCode: string }>;
  isActive: boolean;
  weight?: number;
  createdAt: Date;
  updatedAt: Date;
}

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

// GET /api/products/[id] - Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;

    const product = await Product.findById(id).lean() as ProductDocument | null;

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Only return active products to public, admins can see all
    const authHeader = request.headers.get('authorization');
    

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        if (auth) {
          const decodedToken = await auth.verifyIdToken(token);
          await User.findOne({ firebaseUid: decodedToken.uid });
          
        }
      } catch {
        // Not authenticated, continue as public user
      }
    }

    // Hide inactive products from non-admin users
    if (!product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Product GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch product' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    await requireAdminAuth(request);
    
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();

    const {
      name: nameField,
      Name: NameField,
      description,
      pricing,
      denomination,
      images,
      showClothsProvided,
      colors,
      isActive,
      weight
    } = body;
    
    // Handle both 'name' and 'Name' field variations
    const name = nameField || NameField;

    // Find existing product
    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validation
    if (pricing !== undefined) {
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
    }

    // Validate sizes if provided
 

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

    // Update product
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (pricing !== undefined) updateData.pricing = pricing;
    if (denomination !== undefined) updateData.denomination = denomination;
    if (images !== undefined) updateData.images = images;
    if (showClothsProvided !== undefined) updateData.showClothsProvided = showClothsProvided;
    if (colors !== undefined) updateData.colors = colors;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : undefined;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Product PUT error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update product' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    await requireAdminAuth(request);
    
    await dbConnect();
    
    const { id } = await params;

    // First, get the product to access its images
    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete all images from S3
    if (existingProduct.images && existingProduct.images.length > 0) {
      try {
        for (const imageUrl of existingProduct.images) {
          await S3Service.deleteImage(S3Service.extractKeyFromUrl(imageUrl));
        }
      } catch (imageError) {
        console.error('Error deleting images from S3:', imageError);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete the product from database
    const deletedProduct = await Product.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Product and associated images deleted successfully',
      data: deletedProduct
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Product DELETE error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete product' 
      },
      { status: 500 }
    );
  }
}