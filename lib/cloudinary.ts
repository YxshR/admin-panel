import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  bytes: number
  format: string
  width: number
  height: number
  resource_type: string
  created_at: string
  version: number
  folder?: string
}

export interface CloudinaryUploadOptions {
  folder?: string
  public_id?: string
  transformation?: any[]
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
  format?: string
  quality?: string | number
  width?: number
  height?: number
  crop?: string
  tags?: string[]
}

/**
 * Upload image to Cloudinary
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  if (!validateCloudinaryConfig()) {
    throw new Error('Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.')
  }

  try {
    const uploadOptions = {
      resource_type: 'image' as const,
      folder: options.folder || 'admin-panel',
      quality: options.quality || 'auto',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      ...options,
    }

    const uploadSource = file instanceof Buffer 
      ? `data:image/jpeg;base64,${file.toString('base64')}` 
      : file as string

    const result = await cloudinary.uploader.upload(uploadSource, uploadOptions)

    return result as CloudinaryUploadResult
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image to Cloudinary')
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete image from Cloudinary')
  }
}

/**
 * Generate thumbnail URL from Cloudinary
 */
export function generateThumbnailUrl(
  publicId: string,
  width: number = 300,
  height: number = 300
): string {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
  })
}

/**
 * Generate optimized image URL
 */
export function generateOptimizedUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
    crop?: string
  } = {}
): string {
  return cloudinary.url(publicId, {
    quality: options.quality || 'auto',
    width: options.width,
    height: options.height,
    crop: options.crop || 'scale',
  })
}

/**
 * Validate Cloudinary configuration
 */
export function validateCloudinaryConfig(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

export default cloudinary