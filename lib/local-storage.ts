import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { createHash } from 'crypto'

export interface LocalUploadResult {
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

export interface LocalUploadOptions {
  folder?: string
  public_id?: string
  tags?: string[]
}

/**
 * Upload image to local storage as fallback
 */
export async function uploadToLocalStorage(
  file: Buffer,
  options: LocalUploadOptions = {}
): Promise<LocalUploadResult> {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads'
    const folder = options.folder || 'admin-panel'
    const fullUploadPath = path.join(uploadDir, folder)

    // Create directory if it doesn't exist
    if (!existsSync(fullUploadPath)) {
      await mkdir(fullUploadPath, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const hash = createHash('md5').update(file).digest('hex').substring(0, 8)
    const publicId = options.public_id || `${folder}/${timestamp}_${hash}`
    const filename = `${timestamp}_${hash}.jpg`
    const filePath = path.join(fullUploadPath, filename)

    // Write file
    await writeFile(filePath, file)

    // Get file stats
    const stats = {
      size: file.length
    }

    // Return Cloudinary-compatible result
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const publicUrl = `${baseUrl}/uploads/${folder}/${filename}`

    return {
      public_id: publicId,
      secure_url: publicUrl,
      url: publicUrl,
      bytes: stats.size,
      format: 'jpg',
      width: 0, // Would need image processing library to get actual dimensions
      height: 0,
      resource_type: 'image',
      created_at: new Date().toISOString(),
      version: 1,
      folder
    }
  } catch (error) {
    console.error('Local storage upload error:', error)
    throw new Error('Failed to upload image to local storage')
  }
}

/**
 * Generate thumbnail URL for local storage
 */
export function generateLocalThumbnailUrl(
  publicId: string,
  width: number = 300,
  height: number = 300
): string {
  // For local storage, we'll return the original URL
  // In a real implementation, you'd want to generate actual thumbnails
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  if (publicId.startsWith('http')) {
    return publicId
  }
  
  // Extract the filename from public_id (e.g., "admin-panel/images/1759138943086_aacb8ca8" -> "1759138943086_aacb8ca8.jpg")
  const parts = publicId.split('/')
  const filename = parts[parts.length - 1]
  const folder = parts.slice(0, -1).join('/')
  
  return `${baseUrl}/uploads/${folder}/${filename}.jpg`
}