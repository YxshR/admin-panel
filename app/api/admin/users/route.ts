import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'
import { ApiResponse } from '@/types'
import { Role, Status } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email address').max(254, 'Email too long').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
})

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').max(254, 'Email too long').toLowerCase().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(Status).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long').optional(),
})

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(Status).optional(),
})

// GET /api/admin/users - List users with pagination and filters
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can view users
    if (user.role !== 'ADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
    })

    const skip = (query.page - 1) * query.limit

    // Build where clause
    const where: any = {}
    
    if (query.search) {
      where.email = {
        contains: query.search,
        mode: 'insensitive'
      }
    }
    
    if (query.role) {
      where.role = query.role
    }
    
    if (query.status) {
      where.status = query.status
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              uploadedImages: true,
              activityLogs: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.user.count({ where })
    ])

    const totalPages = Math.ceil(total / query.limit)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        users,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        }
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
})

// POST /api/admin/users - Create new user
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can create users
    if (user.role !== 'ADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        status: validatedData.status,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'USER_CREATED',
        details: {
          targetUserId: newUser.id,
          targetUserEmail: newUser.email,
          role: newUser.role,
        },
        userId: user.id,
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: newUser,
      message: 'User created successfully'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
})