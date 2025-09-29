import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const categoryUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be less than 50 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(200, 'Description must be less than 200 characters')
    .optional()
    .nullable()
})

const categoryDeleteSchema = z.object({
  reassignToCategoryId: z.string().optional()
})

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        imageCount: category._count.images,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = categoryUpdateSchema.parse(body)

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if new name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameExists = await prisma.category.findUnique({
        where: { name: validatedData.name }
      })

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'Category name already exists' },
          { status: 400 }
        )
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE_CATEGORY',
        details: {
          categoryId: updatedCategory.id,
          categoryName: updatedCategory.name,
          changes: validatedData
        },
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        imageCount: updatedCategory._count.images,
        createdAt: updatedCategory.createdAt,
        updatedAt: updatedCategory.updatedAt
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category with image reassignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { reassignToCategoryId } = categoryDeleteSchema.parse(body)

    // Check if category exists and get image count
    const categoryToDelete = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    if (!categoryToDelete) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    const imageCount = categoryToDelete._count.images

    // If category has images, handle reassignment
    if (imageCount > 0) {
      if (!reassignToCategoryId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Category has images. Please specify a category to reassign images to.',
            imageCount 
          },
          { status: 400 }
        )
      }

      // Verify reassignment category exists
      const reassignCategory = await prisma.category.findUnique({
        where: { id: reassignToCategoryId }
      })

      if (!reassignCategory) {
        return NextResponse.json(
          { success: false, error: 'Reassignment category not found' },
          { status: 400 }
        )
      }

      // Reassign images to new category
      await prisma.image.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignToCategoryId }
      })
    }

    // Delete the category
    await prisma.category.delete({
      where: { id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'DELETE_CATEGORY',
        details: {
          categoryId: id,
          categoryName: categoryToDelete.name,
          imageCount,
          reassignedTo: reassignToCategoryId
        },
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: `Category deleted successfully. ${imageCount} images reassigned.`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}