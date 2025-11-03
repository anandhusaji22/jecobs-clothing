import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const runtime = 'nodejs';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!

export class S3Service {
  static async uploadImage(
    file: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
      })

      await s3Client.send(command)
      return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    } catch (error) {
      console.error('Error uploading to S3:', error)
      throw new Error('Failed to upload image to S3')
    }
  }

  static async deleteImage(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })

      await s3Client.send(command)
    } catch (error) {
      console.error('Error deleting from S3:', error)
      throw new Error('Failed to delete image from S3')
    }
  }

  static async getSignedUploadUrl(key: string, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ACL: 'public-read',
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
      return signedUrl
    } catch (error) {
      console.error('Error generating signed URL:', error)
      throw new Error('Failed to generate signed URL')
    }
  }

  static extractKeyFromUrl(url: string): string {
    // Extract the key from the S3 URL
    const urlParts = url.split('/')
    return urlParts.slice(3).join('/') // Remove protocol and domain parts
  }

  static generateImageKey(productId: string, fileName: string): string {
    const timestamp = Date.now()
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `products/${productId}/${timestamp}_${cleanFileName}`
  }
}