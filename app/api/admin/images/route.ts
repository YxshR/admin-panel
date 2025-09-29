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
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const categoryId = formData.get('categoryId') as string
    const tagsString = formData.get('tags') as string

    if (!file) {
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
    const validatedData = imageUploadSchema.parse({
      title,
      description: description || undefined,
      tags,
      categoryId,
    })

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(buffer, {
      folder: 'admin-panel/images',
      tags: ['admin-panel', ...validatedData.tags],
    })

    // Generate thumbnail URL
    const thumbnailUrl = generateThumbnailUrl(cloudinaryResult.public_id, 300, 300)

    // Save to database
    const image = await prisma.image.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        cloudinaryId: cloudinaryResult.public_id,
        thumbnailUrl,
        originalUrl: cloudinaryResult.secure_url,
        fileSize: cloudinaryResult.bytes,
        categoryId: validatedData.categoryId,
        uploadedById: session.user.id,
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
    await prisma.activityLog.create({
      data: {
        action: 'IMAGE_UPLOAD',
        details: {
          imageId: image.id,
          title: image.title,
          categoryId: image.categoryId,
          fileSize: image.fileSize,
        },
        userId: session.user.id,
        imageId: image.id,
      }
    })

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
          details: error.issues 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}