import useSWR from 'swr'
import { cacheKeys } from '../swr-config'

interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  _count?: {
    images: number
  }
}

interface CategoryListResponse {
  categories: Category[]
  pagination?: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface UseCategoriesParams {
  page?: number
  limit?: number
  search?: string
}

interface UseCategoriesReturn {
  data: CategoryListResponse | null
  categories: Category[]
  pagination: CategoryListResponse['pagination'] | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useCategories(params: UseCategoriesParams = {}): UseCategoriesReturn {
  const { page, limit, search } = params
  
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: CategoryListResponse }>(
    cacheKeys.categories({ page, limit, search }),
    {
      // Categories don't change often, cache for 5 minutes
      dedupingInterval: 5 * 60 * 1000,
      // Revalidate on focus
      revalidateOnFocus: true
    }
  )

  return {
    data: data?.data || null,
    categories: data?.data?.categories || [],
    pagination: data?.data?.pagination || null,
    isLoading,
    error: error?.message || null,
    refetch: () => mutate()
  }
}

// Hook for getting all categories (no pagination) - useful for dropdowns
export function useAllCategories() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Category[] }>(
    '/categories/all',
    {
      // Categories for dropdowns should be cached longer
      dedupingInterval: 10 * 60 * 1000,
      // Don't revalidate on focus for dropdown data
      revalidateOnFocus: false
    }
  )

  return {
    categories: data?.data || [],
    isLoading,
    error: error?.message || null,
    refetch: () => mutate()
  }
}