import { NextRequest, NextResponse } from 'next/server'
import { S3Service } from '@/lib/s3Service'
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const productId = formData.get('productId') as string

    if (!file || !productId) {
      return NextResponse.json(
        { error: 'File and productId are required' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique key for the image
    const imageKey = S3Service.generateImageKey(productId, file.name)

    // Upload to S3
    const imageUrl = await S3Service.uploadImage(buffer, imageKey, file.type)

    return NextResponse.json({
      success: true,
      imageUrl,
      imageKey
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Extract key from URL and delete from S3
    const imageKey = S3Service.extractKeyFromUrl(imageUrl)
    await S3Service.deleteImage(imageKey)

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}