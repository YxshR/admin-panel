import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'
import { ApiResponse } from '@/types'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sanitizeString } from '@/lib/validations'

// Validation schemas
const updateProfileSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email too long')
    .toLowerCase()
    .transform(sanitizeString)
    .optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .max(128, 'Password too long'),
  confirmPassword: z.string()
    .min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// GET /api/admin/profile - Get current user profile
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
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
      }
    })

    if (!userProfile) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: userProfile
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
})

// PUT /api/admin/profile - Update user profile
export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check if email is being changed and if it already exists
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (existingUser) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: validatedData,
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
        action: 'PROFILE_UPDATED',
        details: {
          changes: validatedData,
        },
        userId: user.id,
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating profile:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
})