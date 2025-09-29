import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ApiResponse } from '@/types'

export function withAuth<T = any>(
  handler: (request: NextRequest, user: { id: string; email: string; role: string }) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | ApiResponse>> => {
    try {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET 
      })

      if (!token) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const user = {
        id: token.sub!,
        email: token.email!,
        role: token.role as string
      }

      return await handler(request, user)
    } catch (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }
}

export function withOptionalAuth<T = any>(
  handler: (request: NextRequest, user?: { id: string; email: string; role: string }) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    try {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET 
      })

      if (token) {
        const user = {
          id: token.sub!,
          email: token.email!,
          role: token.role as string
        }
        return await handler(request, user)
      } else {
        return await handler(request, undefined)
      }
    } catch (error) {
      return await handler(request, undefined)
    }
  }
}