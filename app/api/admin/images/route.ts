import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary, generateThumbnailUrl } from '@/lib/cloudinary'
import { z } from 'zod'

// Validation schema for image listing
const imageListSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

// Validation schema for image upload
const imageUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  tags: z.string().default(''),
  categoryId: z.string().min(1, 'Category is required'),
})

/**
 * GET /api/admin/images - List images with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = imageListSchema.parse({
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    // Build where clause for filtering
    const where: any = {}

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { tags: { hasSome: [params.search] } },
      ]
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId
    }

    // Calculate pagination
    const skip = (params.page - 1) * params.limit

    // Fetch images with related data
    const [images, totalCount] = await Promise.all([
      prisma.image.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            }
          },
          uploadedBy: {
            select: {
              id: true,
              email: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: params.limit,
      }),
      prisma.image.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / params.limit)

    return NextResponse.json({
      success: true,
      data: {
        images,
        pagination: {
          page: params.page,
          limit: params.limit,
          totalCount,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        }
      }
    })

  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/images - Upload new image
 */
export async function POST(request: NextRequest) {
  console.log('🚀 Image upload request started')
  
  try {
    const session = await getServerSession(authOptions)

    console.log('Session debug:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in to upload images' },
        { status: 401 }
      )
    }

    // Get user ID from session, fallback to email lookup if needed
    let userId = session.user.id
    if (!userId && session.user.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true }
        })
        if (user) {
          userId = user.id
        }
      } catch (error) {
        console.error('Error finding user by email:', error)
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found in session. Please log out and log in again.' },
        { status: 401 }
      )
    }

    let formData
    try {
      console.log('📝 Parsing form data...')
      formData = await request.formData()
      console.log('✅ Form data parsed successfully')
    } catch (error) {
      console.error('❌ FormData parsing error:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid form data. Please ensure you are sending a proper multipart/form-data request.' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const categoryId = formData.get('categoryId') as string
    const tagsString = formData.get('tags') as string

    console.log('📋 Form data extracted:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      title,
      categoryId,
      hasDescription: !!description,
      hasTags: !!tagsString
    })

    if (!file) {
      console.error('❌ No file provided in form data')
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Parse tags
    let tags: string = ''
    if (tagsString) {
      try {
        const parsedTags = JSON.parse(tagsString)
        tags = Array.isArray(parsedTags) ? parsedTags.join(',') : tagsString
      } catch {
        tags = tagsString
      }
    }

    // Validate form data
    console.log('🔍 Validating form data...')
    const validatedData = imageUploadSchema.parse({
      title,
      description: description || undefined,
      tags,
      categoryId,
    })
    console.log('✅ Form data validation passed')

    // Verify category exists
    console.log('🏷️ Verifying category exists...')
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId }
    })

    if (!category) {
      console.error('❌ Category not found:', validatedData.categoryId)
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 400 }
      )
    }
    console.log('✅ Category verified:', category.name)

    // Convert file to buffer
    console.log('🔄 Converting file to buffer...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('✅ File converted to buffer:', buffer.length, 'bytes')

    // Try Cloudinary first, fallback to local storage
    let uploadResult
    let thumbnailUrl

    try {
      // Check Cloudinary configuration first
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary configuration missing')
      }

      // Upload to Cloudinary
      uploadResult = await uploadToCloudinary(buffer, {
        folder: 'admin-panel/images',
        tags: ['admin-panel', validatedData.tags].filter(Boolean),
      })

      // Generate thumbnail URL
      thumbnailUrl = generateThumbnailUrl(uploadResult.public_id, 300, 300)
      
      console.log('Cloudinary upload successful:', { 
        publicId: uploadResult.public_id, 
        size: uploadResult.bytes 
      })
    } catch (cloudinaryError) {
      console.warn('Cloudinary upload failed, using local storage:', cloudinaryError)

      try {
        // Fallback to local storage
        const { uploadToLocalStorage, generateLocalThumbnailUrl } = await import('@/lib/local-storage')
        uploadResult = await uploadToLocalStorage(buffer, {
          folder: 'admin-panel/images',
          tags: ['admin-panel', validatedData.tags].filter(Boolean),
        })

        thumbnailUrl = generateLocalThumbnailUrl(uploadResult.public_id, 300, 300)
        
        console.log('Local storage upload successful:', { 
          publicId: uploadResult.public_id, 
          size: uploadResult.bytes 
        })
      } catch (localError) {
        console.error('Both Cloudinary and local storage failed:', { cloudinaryError, localError })
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to upload image to both cloud and local storage',
            details: {
              cloudinary: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error',
              localStorage: localError instanceof Error ? localError.message : 'Unknown error'
            }
          },
          { status: 500 }
        )
      }
    }

    // Save to database
    console.log('Saving image to database:', {
      title: validatedData.title,
      categoryId: validatedData.categoryId,
      userId,
      fileSize: uploadResult.bytes
    })

    const image = await prisma.image.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        cloudinaryId: uploadResult.public_id,
        thumbnailUrl,
        originalUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        categoryId: validatedData.categoryId,
        uploadedById: userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        uploadedBy: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    })

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          action: 'IMAGE_UPLOAD',
          details: {
            imageId: image.id,
            title: image.title,
            categoryId: image.categoryId,
            fileSize: image.fileSize,
          },
          userId: userId,
          imageId: image.id,
        }
      })
    } catch (activityLogError) {
      console.warn('Failed to create activity log:', activityLogError)
      // Don't fail the upload if activity logging fails
    }

    return NextResponse.json({
      success: true,
      data: image,
      message: 'Image uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading image:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as any
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'An image with this Cloudinary ID already exists' },
          { status: 409 }
        )
      }
      if (dbError.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: 'Invalid category or user reference' },
          { status: 400 }
        )
      }
    }

    // Return more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload image',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}