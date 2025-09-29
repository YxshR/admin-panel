import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const action = searchParams.get('action') || ''
    const userId = searchParams.get('userId') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const flagged = searchParams.get('flagged')
    const export_format = searchParams.get('export')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        {
          action: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          image: {
            title: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    if (action) {
      where.action = {
        contains: action,
        mode: 'insensitive'
      }
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    if (flagged === 'true') {
      where.action = {
        contains: 'SUSPICIOUS_ACTIVITY'
      }
    }

    // Get total count for pagination
    const total = await prisma.activityLog.count({ where })

    // Get activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where,
      skip: export_format ? 0 : skip,
      take: export_format ? undefined : limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        image: {
          select: {
            id: true,
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
      user: {
        id: log.user.id,
        email: log.user.email,
        role: log.user.role
      },
      image: log.image ? {
        id: log.image.id,
        title: log.image.title,
        thumbnailUrl: log.image.thumbnailUrl
      } : null,
      isSuspicious: log.action.includes('SUSPICIOUS_ACTIVITY'),
      isFlagged: log.details && typeof log.details === 'object' && 'flagged' in log.details
    }))

    // Handle CSV export
    if (export_format === 'csv') {
      const csvHeaders = [
        'Date',
        'Time',
        'User Email',
        'User Role',
        'Action',
        'Image Title',
        'Details',
        'Suspicious'
      ]

      const csvRows = formattedActivity.map(log => [
        log.createdAt.toISOString().split('T')[0],
        log.createdAt.toISOString().split('T')[1].split('.')[0],
        log.user.email,
        log.user.role,
        log.action,
        log.image?.title || '',
        JSON.stringify(log.details || {}),
        log.isSuspicious ? 'Yes' : 'No'
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      activity: formattedActivity,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Activity logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}