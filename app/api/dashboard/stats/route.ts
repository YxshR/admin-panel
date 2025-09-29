import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cache key for dashboard stats
    const cacheKey = 'dashboard:stats'
    
    // Try to get from cache first (cache for 1 minute)
    const { serverCache } = await import('@/lib/cache')
    const cachedStats = serverCache.get(cacheKey)
    
    if (cachedStats) {
      return NextResponse.json(cachedStats)
    }

    // Get dashboard statistics with optimized queries
    const [
      totalImages,
      totalCategories,
      totalUsers,
      totalStorage,
      recentImages
    ] = await Promise.all([
      // Total images count
      prisma.image.count(),
      
      // Total categories count
      prisma.category.count(),
      
      // Total users count
      prisma.user.count(),
      
      // Total storage used (sum of all image file sizes)
      prisma.image.aggregate({
        _sum: {
          fileSize: true
        }
      }),
      
      // Recent images for activity feed - optimized with select
      prisma.image.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          thumbnailUrl: true,
          uploadedBy: {
            select: {
              email: true
            }
          },
          category: {
            select: {
              name: true
            }
          }
        }
      })
    ])

    // Convert storage from bytes to MB
    const storageUsedMB = totalStorage._sum.fileSize 
      ? Math.round(totalStorage._sum.fileSize / (1024 * 1024) * 100) / 100
      : 0

    // Calculate storage warning (assuming 1GB = 1024MB limit for demo)
    const storageLimit = 1024 // 1GB in MB
    const storagePercentage = (storageUsedMB / storageLimit) * 100
    const storageWarning = storagePercentage > 80

    const stats = {
      totalImages,
      totalCategories,
      totalUsers,
      storageUsed: storageUsedMB,
      storageLimit,
      storagePercentage: Math.round(storagePercentage * 100) / 100,
      storageWarning,
      recentActivity: recentImages.map(image => ({
        id: image.id,
        title: image.title,
        uploadedBy: image.uploadedBy.email,
        category: image.category.name,
        createdAt: image.createdAt,
        thumbnailUrl: image.thumbnailUrl
      }))
    }

    // Cache the stats for 1 minute
    serverCache.set(cacheKey, stats, 60 * 1000)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}