import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverCache } from '@/lib/cache'

/**
 * GET /api/categories/all - Get all categories for dropdowns (no pagination)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Cache key for all categories
    const cacheKey = 'categories:all'
    
    // Try to get from cache first (cache for 10 minutes since categories don't change often)
    const cachedCategories = serverCache.get(cacheKey)
    
    if (cachedCategories) {
      return NextResponse.json({
        success: true,
        data: cachedCategories
      })
    }

    // Fetch all categories with image counts
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            images: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Cache for 10 minutes
    serverCache.set(cacheKey, categories, 10 * 60 * 1000)

    return NextResponse.json({
      success: true,
      data: categories
    })

  } catch (error) {
    console.error('Error fetching all categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}