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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get recent activity logs
    const activityLogs = await prisma.activityLog.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            email: true
          }
        },
        image: {
          select: {
            title: true,
            thumbnailUrl: true
          }
        }
      }
    })

    const formattedActivity = activityLogs.map(log => ({
      id: log.id,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt,
      user: log.user.email,
      image: log.image ? {
        title: log.image.title,
        thumbnailUrl: log.image.thumbnailUrl
      } : null
    }))

    return NextResponse.json({ activity: formattedActivity })
  } catch (error) {
    console.error('Dashboard activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}