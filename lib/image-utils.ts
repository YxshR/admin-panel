// Dynamic import for Sharp to handle environments where it might not be available
let sharp: typeof import('sharp') | null = null

async function getSharp() {
  if (!sharp) {
    try {
      sharp = (await import('sharp')).default
    } catch (error) {
      console.warn('Sharp not available, image optimization disabled:', error)
      return null
    }
  }
  return sharp
}

// Supported image types
const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
]

// Maximum dimensions for optimization
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1080
const THUMBNAIL_WIDTH = 400
const THUMBNAIL_HEIGHT = 300

export interface ImageValidation {
  isValid: boolean
  error?: string
}

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  thumbnail?: boolean
}

/**
 * Validates an uploaded image file
 */
export function validateImageFile(file: File, maxSize: number): ImageValidation {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided' }
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return { 
      isValid: false, 
      error: `File size exceeds ${maxSizeMB}MB limit` 
    }
  }

  // Check file type
  if (!SUPPORTED_TYPES.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Unsupported file type. Please use JPEG, PNG, WebP, or GIF' 
    }
  }

  // Check file name
  if (!file.name || file.name.length > 255) {
    return { 
      isValid: false, 
      error: 'Invalid file name' 
    }
  }

  return { isValid: true }
}

/**
 * Optimizes an image buffer using Sharp
 */
export async function optimizeImage(
  buffer: Buffer, 
  fileExtension: string,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  try {
    const sharpInstance = await getSharp()
    if (!sharpInstance) {
      // Return original buffer if Sharp is not available
      return buffer
    }

    const {
      width = MAX_WIDTH,
      height = MAX_HEIGHT,
      quality = 85,
      format,
      thumbnail = false
    } = options

    let image = sharpInstance(buffer)

    // Get image metadata
    const metadata = await image.metadata()
    
    // Resize if image is larger than max dimensions or if creating thumbnail
    const targetWidth = thumbnail ? THUMBNAIL_WIDTH : width
    const targetHeight = thumbnail ? THUMBNAIL_HEIGHT : height
    
    if (metadata.width && metadata.height) {
      if (metadata.width > targetWidth || metadata.height > targetHeight || thumbnail) {
        image = image.resize(targetWidth, targetHeight, {
          fit: 'inside',
          withoutEnlargement: !thumbnail
        })
      }
    }

    // Determine output format
    let outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg'
    
    if (format) {
      outputFormat = format
    } else {
      // Auto-detect format based on file extension
      const ext = fileExtension.toLowerCase()
      if (ext === '.png') outputFormat = 'png'
      else if (ext === '.webp') outputFormat = 'webp'
    }

    // Apply format-specific optimizations
    switch (outputFormat) {
      case 'jpeg':
        image = image.jpeg({ 
          quality,
          progressive: true,
          mozjpeg: true
        })
        break
      case 'png':
        image = image.png({ 
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        break
      case 'webp':
        image = image.webp({ 
          quality,
          effort: 6
        })
        break
    }

    return await image.toBuffer()

  } catch (error) {
    console.error('Image optimization error:', error)
    // Return original buffer if optimization fails
    return buffer
  }
}

/**
 * Creates a thumbnail version of an image
 */
export async function createThumbnail(
  buffer: Buffer,
  fileExtension: string
): Promise<Buffer> {
  return optimizeImage(buffer, fileExtension, {
    thumbnail: true,
    quality: 80,
    format: 'webp'
  })
}

/**
 * Gets image dimensions from buffer
 */
export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  try {
    const sharpInstance = await getSharp()
    if (!sharpInstance) return null

    const metadata = await sharpInstance(buffer).metadata()
    if (metadata.width && metadata.height) {
      return {
        width: metadata.width,
        height: metadata.height
      }
    }
    return null
  } catch (error) {
    console.error('Error getting image dimensions:', error)
    return null
  }
}

/**
 * Converts image to WebP format for better compression
 */
export async function convertToWebP(buffer: Buffer, quality: number = 85): Promise<Buffer> {
  try {
    const sharpInstance = await getSharp()
    if (!sharpInstance) return buffer

    return await sharpInstance(buffer)
      .webp({ quality, effort: 6 })
      .toBuffer()
  } catch (error) {
    console.error('WebP conversion error:', error)
    return buffer
  }
}

/**
 * Validates image dimensions
 */
export async function validateImageDimensions(
  buffer: Buffer,
  minWidth: number = 100,
  minHeight: number = 100,
  maxWidth: number = MAX_WIDTH,
  maxHeight: number = MAX_HEIGHT
): Promise<ImageValidation> {
  try {
    const dimensions = await getImageDimensions(buffer)
    
    if (!dimensions) {
      return { isValid: false, error: 'Could not read image dimensions' }
    }

    if (dimensions.width < minWidth || dimensions.height < minHeight) {
      return { 
        isValid: false, 
        error: `Image too small. Minimum size: ${minWidth}x${minHeight}px` 
      }
    }

    if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
      return { 
        isValid: false, 
        error: `Image too large. Maximum size: ${maxWidth}x${maxHeight}px` 
      }
    }

    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: 'Invalid image file' }
  }
}