import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ActivityLogger } from '@/lib/activity-logger'
import { ApiResponse } from '@/types'

// Handle login activity logging and session validation
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Log successful login activity
    try {
      await ActivityLogger.logLogin(token.email as string, token.sub!)
    } catch (logError) {
      console.error('Failed to log login activity:', logError)
      // Don't fail the login if logging fails
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login logging error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}