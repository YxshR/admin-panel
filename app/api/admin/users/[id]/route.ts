import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'
import { ApiResponse } from '@/types'
import { Role, Status } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').max(254, 'Email too long').toLowerCase().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(Status).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long').optional(),
})

// GET /api/admin/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request: NextRequest, user) => {
    const { id } = await params
    try {
      // Only admins can view user details
      if (user.role !== 'ADMIN') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      const targetUser = await prisma.user.findUnique({
        where: { id },
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

      if (!targetUser) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: targetUser
      })
    } catch (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch user' },
        { status: 500 }
      )
    }
  })(request)
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request: NextRequest, user) => {
    const { id } = await params
    try {
      // Only admins can update users
      if (user.role !== 'ADMIN') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Prevent users from modifying themselves
      if (user.id === id) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Cannot modify your own account' },
          { status: 400 }
        )
      }

      const body = await request.json()
      const validatedData = updateUserSchema.parse(body)

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      // Check email uniqueness if email is being updated
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: validatedData.email }
        })

        if (emailExists) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'User with this email already exists' },
            { status: 400 }
          )
        }
      }

      // Prepare update data
      const updateData: any = {}
      
      if (validatedData.email) updateData.email = validatedData.email
      if (validatedData.role) updateData.role = validatedData.role
      if (validatedData.status !== undefined) updateData.status = validatedData.status
      
      if (validatedData.password) {
        updateData.password = await bcrypt.hash(validatedData.password, 12)
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
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
          action: 'USER_UPDATED',
          details: {
            targetUserId: updatedUser.id,
            targetUserEmail: updatedUser.email,
            changes: validatedData,
          },
          userId: user.id,
        }
      })

      return NextResponse.json<ApiResponse>({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: error.issues[0].message },
          { status: 400 }
        )
      }

      console.error('Error updating user:', error)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      )
    }
  })(request)
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request: NextRequest, user) => {
    const { id } = await params
    try {
      // Only admins can delete users
      if (user.role !== 'ADMIN') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Prevent users from deleting themselves
      if (user.id === id) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Cannot delete your own account' },
          { status: 400 }
        )
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          _count: {
            select: {
              uploadedImages: true,
              activityLogs: true,
            }
          }
        }
      })

      if (!existingUser) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      // Log activity before deletion
      await prisma.activityLog.create({
        data: {
          action: 'USER_DELETED',
          details: {
            targetUserId: existingUser.id,
            targetUserEmail: existingUser.email,
            role: existingUser.role,
            imageCount: existingUser._count.uploadedImages,
          },
          userId: user.id,
        }
      })

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id }
      })

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'User deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      )
    }
  })(request)
}