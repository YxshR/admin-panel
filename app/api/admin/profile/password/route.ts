import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'
import { ApiResponse } from '@/types'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Validation schema for password change
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

// POST /api/admin/profile/password - Change user password
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Get current user with password
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        password: true,
      }
    })

    if (!currentUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      currentUser.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(
      validatedData.newPassword,
      currentUser.password
    )

    if (isSamePassword) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_CHANGED',
        details: {
          timestamp: new Date().toISOString(),
        },
        userId: user.id,
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error changing password:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    )
  }
})