import useSWR from 'swr'
import { cacheKeys } from '../swr-config'

interface DashboardStats {
  totalImages: number
  totalCategories: number
  totalUsers: number
  storageUsed: number
  storageLimit: number
  storagePercentage: number
  storageWarning: boolean
  recentActivity: Array<{
    id: string
    title: string
    uploadedBy: string
    category: string
    createdAt: string
    thumbnailUrl: string
  }>
}

interface UseDashboardReturn {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboard(): UseDashboardReturn {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    cacheKeys.dashboardStats,
    {
      // Refresh dashboard stats every 30 seconds
      refreshInterval: 30000,
      // Keep data fresh for 1 minute
      dedupingInterval: 60000,
      // Revalidate on focus for real-time updates
      revalidateOnFocus: true
    }
  )

  return {
    stats: data || null,
    isLoading,
    error: error?.message || null,
    refetch: () => mutate()
  }
}