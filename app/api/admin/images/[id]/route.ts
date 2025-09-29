import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { z } from 'zod'

// Validation schema for image update
const imageUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  tags: z.string().default(''),
  categoryId: z.string().min(1, 'Category is required'),
})

/**
 * GET /api/admin/images/[id] - Get single image
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const image = await prisma.image.findUnique({
      where: { id },
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

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: image
    })

  } catch (error) {
    console.error('Error fetching image:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch image' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/images/[id] - Update image metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    // Check if image exists
    const existingImage = await prisma.image.findUnique({
      where: { id },
      include: {
        category: true,
      }
    })

    if (!existingImage) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = imageUpdateSchema.parse(body)

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

    // Update image in database
    const updatedImage = await prisma.image.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        categoryId: validatedData.categoryId,
        updatedAt: new Date(),
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
        action: 'IMAGE_UPDATE',
        details: {
          imageId: updatedImage.id,
          title: updatedImage.title,
          previousTitle: existingImage.title,
          categoryId: updatedImage.categoryId,
          previousCategoryId: existingImage.categoryId,
          changes: {
            title: existingImage.title !== updatedImage.title,
            description: existingImage.description !== updatedImage.description,
            tags: JSON.stringify(existingImage.tags) !== JSON.stringify(updatedImage.tags),
            category: existingImage.categoryId !== updatedImage.categoryId,
          }
        },
        userId: session.user.id,
        imageId: updatedImage.id,
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedImage,
      message: 'Image updated successfully'
    })

  } catch (error) {
    console.error('Error updating image:', error)
    
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
      { success: false, error: 'Failed to update image' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/images/[id] - Delete image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    // Check if image exists
    const existingImage = await prisma.image.findUnique({
      where: { id },
      include: {
        category: true,
      }
    })

    if (!existingImage) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      )
    }

    // Check permissions - only allow deletion by admin or the uploader
    if (session.user.role !== 'ADMIN' && existingImage.uploadedById !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    try {
      // Delete from Cloudinary first
      await deleteFromCloudinary(existingImage.cloudinaryId)
    } catch (cloudinaryError) {
      console.warn('Failed to delete from Cloudinary:', cloudinaryError)
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Log activity before deletion
    await prisma.activityLog.create({
      data: {
        action: 'IMAGE_DELETE',
        details: {
          imageId: existingImage.id,
          title: existingImage.title,
          categoryId: existingImage.categoryId,
          categoryName: existingImage.category.name,
          fileSize: existingImage.fileSize,
          cloudinaryId: existingImage.cloudinaryId,
        },
        userId: session.user.id,
        imageId: existingImage.id,
      }
    })

    // Delete from database
    await prisma.image.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}