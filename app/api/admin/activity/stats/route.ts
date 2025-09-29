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

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get total activity counts
    const [
      totalActivities,
      todayActivities,
      weekActivities,
      monthActivities,
      suspiciousActivities,
      topActions,
      topUsers,
      recentSuspicious
    ] = await Promise.all([
      // Total activities
      prisma.activityLog.count(),
      
      // Today's activities
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: oneDayAgo
          }
        }
      }),
      
      // This week's activities
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: oneWeekAgo
          }
        }
      }),
      
      // This month's activities
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: oneMonthAgo
          }
        }
      }),
      
      // Suspicious activities
      prisma.activityLog.count({
        where: {
          action: {
            contains: 'SUSPICIOUS_ACTIVITY'
          }
        }
      }),
      
      // Top actions
      prisma.activityLog.groupBy({
        by: ['action'],
        _count: {
          action: true
        },
        orderBy: {
          _count: {
            action: 'desc'
          }
        },
        take: 10
      }),
      
      // Top users by activity
      prisma.activityLog.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 10
      }),
      
      // Recent suspicious activities
      prisma.activityLog.findMany({
        where: {
          action: {
            contains: 'SUSPICIOUS_ACTIVITY'
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        include: {
          user: {
            select: {
              email: true,
              role: true
            }
          }
        }
      })
    ])

    // Get user details for top users
    const userIds = topUsers.map(u => u.userId)
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    })

    const topUsersWithDetails = topUsers.map(userStat => {
      const user = users.find(u => u.id === userStat.userId)
      return {
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role
        } : null,
        count: userStat._count.userId
      }
    }).filter(u => u.user !== null)

    // Activity trend data (last 7 days)
    const activityTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      
      const count = await prisma.activityLog.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      })
      
      activityTrend.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      })
    }

    return NextResponse.json({
      stats: {
        total: totalActivities,
        today: todayActivities,
        week: weekActivities,
        month: monthActivities,
        suspicious: suspiciousActivities
      },
      topActions: topActions.map(action => ({
        action: action.action,
        count: action._count.action
      })),
      topUsers: topUsersWithDetails,
      recentSuspicious: recentSuspicious.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details,
        createdAt: log.createdAt,
        user: {
          email: log.user.email,
          role: log.user.role
        }
      })),
      activityTrend
    })
  } catch (error) {
    console.error('Activity stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity statistics' },
      { status: 500 }
    )
  }
}