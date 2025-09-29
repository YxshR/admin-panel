import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { ApiResponse } from '@/types'

// Confirm password reset with new password
export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json()

    if (!token || !email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Token, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find and validate reset token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: token
        }
      }
    })

    if (!verificationToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: token
          }
        }
      })
      
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.status === 'DISABLED') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Account is disabled' },
        { status: 403 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Delete the used reset token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: token
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_RESET',
        details: { email },
        userId: user.id
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Password has been reset successfully'
    })

  } catch (error) {
    console.error('Password reset confirmation error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}