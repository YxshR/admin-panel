import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { 
  handleApiError, 
  createSuccessResponse, 
  validateRequest,
  createAuthError,
  createAuthorizationError,
  createConflictError,
  withErrorHandler
} from '@/lib/api-error-handler'

// Enhanced category schema for admin panel
const categoryCreateSchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be less than 50 characters')
    .trim()
    .refine(name => name.length > 0, 'Category name cannot be empty'),
  description: z.string()
    .max(200, 'Description must be less than 200 characters')
    .optional()
    .nullable()
})

const categoryUpdateSchema = categoryCreateSchema.partial()

// GET /api/categories - List all categories with image counts
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw createAuthError()
  }

  const { searchParams } = new URL(request.url)
  
  // Validate query parameters
  const querySchema = z.object({
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional().default('')
  })

  const { page, limit, search } = validateRequest(querySchema, {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    search: searchParams.get('search') || undefined
  })

  const skip = (page - 1) * limit

  // Build where clause for search
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } }
    ]
  } : {}

  // Get categories with image counts
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { images: true }
        }
      }
    }),
    prisma.category.count({ where })
  ])

  return createSuccessResponse({
    categories: categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      imageCount: category._count.images,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

// POST /api/categories - Create new category
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw createAuthError()
  }

  if (session.user.role !== 'ADMIN') {
    throw createAuthorizationError('Only administrators can create categories')
  }

  const body = await request.json()
  const validatedData = validateRequest(categoryCreateSchema, body)

  // Check if category name already exists
  const existingCategory = await prisma.category.findUnique({
    where: { name: validatedData.name }
  })

  if (existingCategory) {
    throw createConflictError('Category name already exists')
  }

  const category = await prisma.category.create({
    data: {
      name: validatedData.name,
      description: validatedData.description
    },
    include: {
      _count: {
        select: { images: true }
      }
    }
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: 'CREATE_CATEGORY',
      details: {
        categoryId: category.id,
        categoryName: category.name
      },
      userId: session.user.id
    }
  })

  return createSuccessResponse({
    id: category.id,
    name: category.name,
    description: category.description,
    imageCount: category._count.images,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  }, 'Category created successfully', 201)
})