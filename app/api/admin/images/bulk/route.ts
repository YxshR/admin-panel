import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { z } from 'zod'

// Validation schema for bulk operations
const bulkOperationSchema = z.object({
  action: z.enum(['delete', 'updateCategory', 'addTags', 'removeTags']),
  imageIds: z.array(z.string()).min(1, 'At least one image must be selected'),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

/**
 * POST /api/admin/images/bulk - Perform bulk operations on images
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = bulkOperationSchema.parse(body)

    // Fetch images to verify they exist and check permissions
    const images = await prisma.image.findMany({
      where: {
        id: { in: validatedData.imageIds }
      },
      include: {
        category: true,
      }
    })

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images found' },
        { status: 404 }
      )
    }

    if (images.length !== validatedData.imageIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some images were not found' },
        { status: 400 }
      )
    }

    // Check permissions for delete operations
    if (validatedData.action === 'delete' && session.user.role !== 'ADMIN') {
      const unauthorizedImages = images.filter(img => img.uploadedById !== session.user.id)
      if (unauthorizedImages.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to delete some images' },
          { status: 403 }
        )
      }
    }

    let result: any = {}

    switch (validatedData.action) {
      case 'delete':
        result = await handleBulkDelete(images, session.user.id)
        break
      
      case 'updateCategory':
        if (!validatedData.categoryId) {
          return NextResponse.json(
            { success: false, error: 'Category ID is required for category update' },
            { status: 400 }
          )
        }
        result = await handleBulkCategoryUpdate(validatedData.imageIds, validatedData.categoryId, session.user.id)
        break
      
      case 'addTags':
        if (!validatedData.tags || validatedData.tags.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Tags are required for adding tags' },
            { status: 400 }
          )
        }
        result = await handleBulkAddTags(validatedData.imageIds, validatedData.tags, session.user.id)
        break
      
      case 'removeTags':
        if (!validatedData.tags || validatedData.tags.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Tags are required for removing tags' },
            { status: 400 }
          )
        }
        result = await handleBulkRemoveTags(validatedData.imageIds, validatedData.tags, session.user.id)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Error performing bulk operation:', error)
    
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
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}

/**
 * Handle bulk delete operation
 */
async function handleBulkDelete(images: any[], userId: string) {
  const deletedImages: string[] = []
  const failedImages: string[] = []

  for (const image of images) {
    try {
      // Delete from Cloudinary
      try {
        await deleteFromCloudinary(image.cloudinaryId)
      } catch (cloudinaryError) {
        console.warn(`Failed to delete image ${image.id} from Cloudinary:`, cloudinaryError)
        // Continue with database deletion even if Cloudinary deletion fails
      }

      // Log activity before deletion
      await prisma.activityLog.create({
        data: {
          action: 'IMAGE_BULK_DELETE',
          details: {
            imageId: image.id,
            title: image.title,
            categoryId: image.categoryId,
            categoryName: image.category.name,
            fileSize: image.fileSize,
            cloudinaryId: image.cloudinaryId,
          },
          userId,
          imageId: image.id,
        }
      })

      // Delete from database
      await prisma.image.delete({
        where: { id: image.id }
      })

      deletedImages.push(image.id)
    } catch (error) {
      console.error(`Failed to delete image ${image.id}:`, error)
      failedImages.push(image.id)
    }
  }

  return {
    message: `Successfully deleted ${deletedImages.length} images${failedImages.length > 0 ? `, failed to delete ${failedImages.length} images` : ''}`,
    deletedCount: deletedImages.length,
    failedCount: failedImages.length,
    deletedImages,
    failedImages,
  }
}

/**
 * Handle bulk category update operation
 */
async function handleBulkCategoryUpdate(imageIds: string[], categoryId: string, userId: string) {
  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  })

  if (!category) {
    throw new Error('Category not found')
  }

  // Update images
  const updateResult = await prisma.image.updateMany({
    where: {
      id: { in: imageIds }
    },
    data: {
      categoryId,
      updatedAt: new Date(),
    }
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: 'IMAGE_BULK_CATEGORY_UPDATE',
      details: {
        imageIds,
        newCategoryId: categoryId,
        newCategoryName: category.name,
        updatedCount: updateResult.count,
      },
      userId,
    }
  })

  return {
    message: `Successfully updated category for ${updateResult.count} images`,
    updatedCount: updateResult.count,
  }
}

/**
 * Handle bulk add tags operation
 */
async function handleBulkAddTags(imageIds: string[], tagsToAdd: string[], userId: string) {
  let updatedCount = 0

  // Process each image individually to handle tag merging
  for (const imageId of imageIds) {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { tags: true }
    })

    if (image) {
      const existingTags = image.tags || []
      const newTags = [...new Set([...existingTags, ...tagsToAdd])]

      if (newTags.length > existingTags.length) {
        await prisma.image.update({
          where: { id: imageId },
          data: {
            tags: newTags,
            updatedAt: new Date(),
          }
        })
        updatedCount++
      }
    }
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: 'IMAGE_BULK_ADD_TAGS',
      details: {
        imageIds,
        tagsAdded: tagsToAdd,
        updatedCount,
      },
      userId,
    }
  })

  return {
    message: `Successfully added tags to ${updatedCount} images`,
    updatedCount,
  }
}

/**
 * Handle bulk remove tags operation
 */
async function handleBulkRemoveTags(imageIds: string[], tagsToRemove: string[], userId: string) {
  let updatedCount = 0

  // Process each image individually to handle tag removal
  for (const imageId of imageIds) {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { tags: true }
    })

    if (image) {
      const existingTags = image.tags || []
      const newTags = existingTags.filter(tag => !tagsToRemove.includes(tag))

      if (newTags.length < existingTags.length) {
        await prisma.image.update({
          where: { id: imageId },
          data: {
            tags: newTags,
            updatedAt: new Date(),
          }
        })
        updatedCount++
      }
    }
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: 'IMAGE_BULK_REMOVE_TAGS',
      details: {
        imageIds,
        tagsRemoved: tagsToRemove,
        updatedCount,
      },
      userId,
    }
  })

  return {
    message: `Successfully removed tags from ${updatedCount} images`,
    updatedCount,
  }
}