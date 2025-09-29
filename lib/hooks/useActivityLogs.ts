import useSWR from 'swr'
import { cacheKeys } from '../swr-config'

interface ActivityLog {
  id: string
  action: string
  details?: any
  createdAt: string
  user: {
    id: string
    email: string
  }
  image?: {
    id: string
    title: string
  }
}

interface ActivityLogListResponse {
  logs: ActivityLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface UseActivityLogsParams {
  page?: number
  limit?: number
  userId?: string
  action?: string
  startDate?: string
  endDate?: string
}

interface UseActivityLogsReturn {
  data: ActivityLogListResponse | null
  logs: ActivityLog[]
  pagination: ActivityLogListResponse['pagination'] | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useActivityLogs(params: UseActivityLogsParams = {}): UseActivityLogsReturn {
  const { page = 1, limit = 20, userId, action, startDate, endDate } = params
  
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: ActivityLogListResponse }>(
    cacheKeys.activityLogs({ page, limit, userId, action, startDate, endDate }),
    {
      // Activity logs should be fresh for auditing
      dedupingInterval: 1 * 60 * 1000,
      // Revalidate on focus for real-time monitoring
      revalidateOnFocus: true,
      // Refresh every 30 seconds for active monitoring
      refreshInterval: 30000
    }
  )

  return {
    data: data?.data || null,
    logs: data?.data?.logs || [],
    pagination: data?.data?.pagination || null,
    isLoading,
    error: error?.message || null,
    refetch: () => mutate()
  }
}