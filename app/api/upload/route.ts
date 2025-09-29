import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { validateImageFile, optimizeImage, validateImageDimensions } from '@/lib/image-utils'
import { imageUploadSchema } from '@/lib/validations'
import { withSecurity } from '@/lib/security-middleware'
import { scanFileContent, hasSuspiciousFilePattern } from '@/lib/security'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
const MAX_FILES_PER_HOUR = 50 // Rate limit per IP
const ALLOWED_FOLDERS = ['general', 'reels', 'slider', 'thumbnails']

// Simple in-memory rate limiting (use Redis in production)
const uploadCounts = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown'
  return `upload:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const hourMs = 60 * 60 * 1000
  
  const record = uploadCounts.get(key)
  if (!record || record.resetTime < now) {
    uploadCounts.set(key, { count: 1, resetTime: now + hourMs })
    return { allowed: true, remaining: MAX_FILES_PER_HOUR - 1 }
  }
  
  if (record.count >= MAX_FILES_PER_HOUR) {
    return { allowed: false, remaining: 0 }
  }
  
  record.count++
  return { allowed: true, remaining: MAX_FILES_PER_HOUR - record.count }
}

const uploadHandler = async (request: NextRequest) => {
  try {
    // Rate limiting (now handled by security middleware)
    const rateLimitKey = getRateLimitKey(request)
    const rateLimit = checkRateLimit(rateLimitKey)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general'
    const optimize = formData.get('optimize') !== 'false'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate folder name
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid folder name' },
        { status: 400 }
      )
    }

    // Validate file using Zod schema
    try {
      imageUploadSchema.parse({ file, folder, optimize })
    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File validation failed',
          details: error.issues 
        },
        { status: 400 }
      )
    }

    // Enhanced security validation
    if (hasSuspiciousFilePattern(file.name)) {
      return NextResponse.json(
        { success: false, error: 'Suspicious file pattern detected' },
        { status: 400 }
      )
    }

    // Additional file validation
    const validation = validateImageFile(file, MAX_FILE_SIZE)
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // Convert file to buffer for security scanning
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Malware scanning
    const scanResult = scanFileContent(buffer, file.name)
    if (!scanResult.isSafe) {
      console.warn(`Malware detected in upload: ${file.name}`, {
        threats: scanResult.threats,
        confidence: scanResult.confidence
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'File failed security scan',
          details: scanResult.threats 
        },
        { status: 400 }
      )
    }

    // Buffer already created above for security scanning

    // Validate image content and dimensions
    try {
      const dimensionValidation = await validateImageDimensions(buffer)
      if (!dimensionValidation.isValid) {
        return NextResponse.json(
          { success: false, error: dimensionValidation.error },
          { status: 400 }
        )
      }
    } catch (validationError) {
      console.warn('Image dimension validation failed:', validationError)
      // Continue without dimension validation in production
    }

    // Generate content hash for deduplication
    const contentHash = createHash('sha256').update(buffer).digest('hex').substring(0, 16)
    
    // Create upload directory if it doesn't exist
    const uploadPath = path.join(UPLOAD_DIR, folder)
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true, mode: 0o755 })
    }

    // Generate secure filename
    const timestamp = Date.now()
    const randomString = createHash('sha256')
      .update(`${timestamp}-${Math.random()}-${file.name}`)
      .digest('hex')
      .substring(0, 12)
    
    const fileExtension = path.extname(file.name).toLowerCase()
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50)
    
    const fileName = `${timestamp}-${randomString}-${contentHash}${optimize ? '.webp' : fileExtension}`
    const filePath = path.join(uploadPath, fileName)

    // Check if file already exists (deduplication)
    if (existsSync(filePath)) {
      const stats = await stat(filePath)
      return NextResponse.json({
        success: true,
        url: `/uploads/${folder}/${fileName}`,
        filename: fileName,
        size: stats.size,
        originalSize: buffer.length,
        cached: true
      })
    }

    // Optimize image if requested
    let finalBuffer: Buffer = buffer
    if (optimize) {
      try {
        finalBuffer = await optimizeImage(buffer, fileExtension, {
          quality: 85,
          format: 'webp'
        })
      } catch (optimizeError) {
        console.warn('Image optimization failed, using original:', optimizeError)
        finalBuffer = buffer
      }
    }

    // Write file to disk with secure permissions
    await writeFile(filePath, finalBuffer, { mode: 0o644 })

    // Return public URL
    const publicUrl = `/uploads/${folder}/${fileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      size: finalBuffer.length,
      originalSize: buffer.length,
      optimized: optimize,
      contentHash
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimit.remaining.toString()
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}

// Apply security middleware
export const POST = withSecurity(uploadHandler, {
  enableRateLimit: true,
  enableCSRF: true,
  enableXSSProtection: false, // Not needed for file uploads
  enableFileScanning: true,
  logSuspiciousActivity: true
})

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting for deletions
    const rateLimitKey = getRateLimitKey(request)
    const rateLimit = checkRateLimit(rateLimitKey)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      )
    }

    // Validate file path format
    const pathRegex = /^\/uploads\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/
    if (!pathRegex.test(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path format' },
        { status: 400 }
      )
    }

    // Security check: ensure path is within uploads directory
    const relativePath = filePath.replace('/uploads/', '')
    const fullPath = path.join(UPLOAD_DIR, relativePath)
    const normalizedPath = path.normalize(fullPath)
    const normalizedUploadDir = path.normalize(UPLOAD_DIR)
    
    if (!normalizedPath.startsWith(normalizedUploadDir)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Additional security: check if path contains suspicious patterns
    const suspiciousPatterns = [
      /\.\./,
      /\/\.\//,
      /\\\.\\/, 
      /[<>:"|?*]/
    ]
    
    if (suspiciousPatterns.some(pattern => pattern.test(filePath))) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Delete file if it exists
    if (existsSync(normalizedPath)) {
      await unlink(normalizedPath)
    }

    return NextResponse.json({ 
      success: true,
      message: 'File deleted successfully' 
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Delete failed' },
      { status: 500 }
    )
  }
}