import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ActivityLogger } from '@/lib/activity-logger'
import { ApiResponse } from '@/types'

// Handle logout and activity logging
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (token) {
      // Log logout activity
      try {
        await ActivityLogger.logLogout(token.email as string, token.sub!)
      } catch (logError) {
        console.error('Failed to log logout activity:', logError)
        // Don't fail the logout if logging fails
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}