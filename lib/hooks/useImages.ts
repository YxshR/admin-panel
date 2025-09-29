import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { cacheKeys } from '../swr-config'

interface Image {
  id: string
  title: string
  description?: string
  tags: string[]
  cloudinaryId: string
  thumbnailUrl: string
  originalUrl: string
  fileSize: number
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
  }
  uploadedBy: {
    id: string
    email: string
  }
}

interface ImageListResponse {
  images: Image[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface UseImagesParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
}

interface UseImagesReturn {
  data: ImageListResponse | null
  images: Image[]
  pagination: ImageListResponse['pagination'] | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useImages(params: UseImagesParams = {}): UseImagesReturn {
  const { page = 1, limit = 20, search, categoryId } = params
  
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: ImageListResponse }>(
    cacheKeys.images({ page, limit, search, categoryId }),
    {
      // Keep data fresh for 2 minutes
      dedupingInterval: 2 * 60 * 1000,
      // Revalidate on focus
      revalidateOnFocus: true,
      // Keep previous data while loading new page
      keepPreviousData: true
    }
  )

  return {
    data: data?.data || null,
    images: data?.data?.images || [],
    pagination: data?.data?.pagination || null,
    isLoading,
    error: error?.message || null,
    refetch: () => mutate()
  }
}

// Hook for infinite loading/pagination
export function useInfiniteImages(params: Omit<UseImagesParams, 'page'> = {}) {
  const { limit = 20, search, categoryId } = params
  
  const getKey = (pageIndex: number, previousPageData: any) => {
    // If no more data, return null to stop fetching
    if (previousPageData && !previousPageData.data.pagination.hasNext) return null
    
    // Return the SWR key for the page
    return cacheKeys.images({ page: pageIndex + 1, limit, search, categoryId })
  }

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite(getKey, {
    // Keep data fresh for 2 minutes
    dedupingInterval: 2 * 60 * 1000,
    // Don't revalidate on focus for infinite loading
    revalidateOnFocus: false
  })

  // Flatten all pages into a single array
  const images = data ? data.flatMap(page => page.data.images) : []
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.data.images.length === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data.pagination.hasNext === false)

  return {
    images,
    isLoading,
    isLoadingMore,
    isEmpty,
    isReachingEnd,
    error: error?.message || null,
    loadMore: () => setSize(size + 1),
    refetch: () => mutate()
  }
}