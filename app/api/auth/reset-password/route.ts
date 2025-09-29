import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { ApiResponse } from '@/types'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email'

// Generate password reset token
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json<ApiResponse>(
        { success: true, message: 'If an account with that email exists, a reset link has been sent.' }
      )
    }

    if (user.status === 'DISABLED') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Account is disabled' },
        { status: 403 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token in verification token table
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: resetTokenExpiry
      }
    })

    // Send password reset email
    try {
      const emailOptions = generatePasswordResetEmail(email, resetToken)
      await sendEmail(emailOptions)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Don't fail the request if email sending fails
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}