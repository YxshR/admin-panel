import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export interface ActivityLogData {
  action: string
  details?: any
  imageId?: string
  userId?: string
}

export class ActivityLogger {
  static async log(data: ActivityLogData) {
    try {
      // If no userId provided, try to get from session
      let userId = data.userId
      if (!userId) {
        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
          userId = session.user.id
        }
      }

      if (!userId) {
        console.warn('Activity log attempted without user ID:', data.action)
        return null
      }

      const activityLog = await prisma.activityLog.create({
        data: {
          action: data.action,
          details: data.details || null,
          userId,
          imageId: data.imageId || null,
        },
        include: {
          user: {
            select: {
              email: true,
              role: true
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

      // Check for suspicious activity
      await this.checkSuspiciousActivity(userId, data.action)

      return activityLog
    } catch (error) {
      console.error('Failed to log activity:', error)
      return null
    }
  }

  static async checkSuspiciousActivity(userId: string, action: string) {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      // Check for rapid actions (more than 50 actions in 1 hour)
      const recentActions = await prisma.activityLog.count({
        where: {
          userId,
          createdAt: {
            gte: oneHourAgo
          }
        }
      })

      if (recentActions > 50) {
        await this.flagSuspiciousActivity(userId, 'RAPID_ACTIONS', {
          actionCount: recentActions,
          timeWindow: '1 hour',
          lastAction: action
        })
      }

      // Check for bulk deletions (more than 10 deletions in 10 minutes)
      if (action.includes('DELETE')) {
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
        const recentDeletions = await prisma.activityLog.count({
          where: {
            userId,
            action: {
              contains: 'DELETE'
            },
            createdAt: {
              gte: tenMinutesAgo
            }
          }
        })

        if (recentDeletions > 10) {
          await this.flagSuspiciousActivity(userId, 'BULK_DELETIONS', {
            deletionCount: recentDeletions,
            timeWindow: '10 minutes'
          })
        }
      }

      // Check for unusual login patterns (multiple failed attempts)
      if (action === 'LOGIN_FAILED') {
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
        const failedLogins = await prisma.activityLog.count({
          where: {
            userId,
            action: 'LOGIN_FAILED',
            createdAt: {
              gte: fiveMinutesAgo
            }
          }
        })

        if (failedLogins > 5) {
          await this.flagSuspiciousActivity(userId, 'MULTIPLE_FAILED_LOGINS', {
            failedAttempts: failedLogins,
            timeWindow: '5 minutes'
          })
        }
      }
    } catch (error) {
      console.error('Failed to check suspicious activity:', error)
    }
  }

  static async flagSuspiciousActivity(userId: string, type: string, details: any) {
    try {
      await prisma.activityLog.create({
        data: {
          action: `SUSPICIOUS_ACTIVITY_${type}`,
          details: {
            flagged: true,
            suspiciousActivityType: type,
            ...details
          },
          userId
        }
      })

      console.warn(`Suspicious activity detected for user ${userId}: ${type}`, details)
    } catch (error) {
      console.error('Failed to flag suspicious activity:', error)
    }
  }

  // Common activity logging methods
  static async logImageUpload(imageId: string, imageTitle: string, userId?: string) {
    return this.log({
      action: 'IMAGE_UPLOAD',
      details: { imageTitle },
      imageId,
      userId
    })
  }

  static async logImageDelete(imageId: string, imageTitle: string, userId?: string) {
    return this.log({
      action: 'IMAGE_DELETE',
      details: { imageTitle },
      imageId,
      userId
    })
  }

  static async logImageUpdate(imageId: string, imageTitle: string, changes: any, userId?: string) {
    return this.log({
      action: 'IMAGE_UPDATE',
      details: { imageTitle, changes },
      imageId,
      userId
    })
  }

  static async logCategoryCreate(categoryName: string, userId?: string) {
    return this.log({
      action: 'CATEGORY_CREATE',
      details: { categoryName },
      userId
    })
  }

  static async logCategoryUpdate(categoryName: string, changes: any, userId?: string) {
    return this.log({
      action: 'CATEGORY_UPDATE',
      details: { categoryName, changes },
      userId
    })
  }

  static async logCategoryDelete(categoryName: string, userId?: string) {
    return this.log({
      action: 'CATEGORY_DELETE',
      details: { categoryName },
      userId
    })
  }

  static async logUserCreate(userEmail: string, role: string, userId?: string) {
    return this.log({
      action: 'USER_CREATE',
      details: { userEmail, role },
      userId
    })
  }

  static async logUserUpdate(userEmail: string, changes: any, userId?: string) {
    return this.log({
      action: 'USER_UPDATE',
      details: { userEmail, changes },
      userId
    })
  }

  static async logUserDelete(userEmail: string, userId?: string) {
    return this.log({
      action: 'USER_DELETE',
      details: { userEmail },
      userId
    })
  }

  static async logLogin(userEmail: string, userId?: string) {
    return this.log({
      action: 'LOGIN_SUCCESS',
      details: { userEmail },
      userId
    })
  }

  static async logLoginFailed(userEmail: string) {
    return this.log({
      action: 'LOGIN_FAILED',
      details: { userEmail }
    })
  }

  static async logLogout(userEmail: string, userId?: string) {
    return this.log({
      action: 'LOGOUT',
      details: { userEmail },
      userId
    })
  }

  static async logPasswordChange(userEmail: string, userId?: string) {
    return this.log({
      action: 'PASSWORD_CHANGE',
      details: { userEmail },
      userId
    })
  }

  static async logSettingsUpdate(settingType: string, changes: any, userId?: string) {
    return this.log({
      action: 'SETTINGS_UPDATE',
      details: { settingType, changes },
      userId
    })
  }
}