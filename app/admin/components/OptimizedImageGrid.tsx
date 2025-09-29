'use client'

import { useState } from 'react'
import { useImages } from '@/lib/hooks/useImages'
import { useAllCategories } from '@/lib/hooks/useCategories'
import { ImageThumbnail } from '@/lib/components/ImageThumbnail'
import { Pagination } from '@/lib/components/Pagination'
import { Search, Filter, Grid, List } from 'lucide-react'

interface OptimizedImageGridProps {
  onImageSelect?: (imageId: string) => void
}

export default function OptimizedImageGrid({ onImageSelect }: OptimizedImageGridProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Use optimized hooks with SWR caching
  const { images, pagination, isLoading, error } = useImages({
    page,
    limit: 20,
    search: search || undefined,
    categoryId: categoryId || undefined
  })

  const { categories } = useAllCategories()

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page when searching
  }

  const handleCategoryFilter = (value: string) => {
    setCategoryId(value)
    setPage(1) // Reset to first page when filtering
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
        <p className="text-red-400">Error loading images: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none min-h-[44px] sm:min-h-0"
            />
          </div>

          {/* Category Filter */}
          <div className="relative sm:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={categoryId}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-3 sm:py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none appearance-none min-h-[44px] sm:min-h-0"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category._count?.images || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center sm:justify-end">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 sm:p-2 rounded touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 active:bg-gray-700'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 sm:p-2 rounded touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 active:bg-gray-700'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Images Grid/List */}
      {!isLoading && (
        <>
          {images.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No images found</p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4'
                  : 'space-y-3 sm:space-y-4'
              }
            >
              {images.map((image) => (
                <div key={image.id}>
                  {viewMode === 'grid' ? (
                    <ImageThumbnail
                      src={image.thumbnailUrl}
                      alt={image.title}
                      size="lg"
                      onClick={() => onImageSelect?.(image.id)}
                      priority={images.indexOf(image) < 6} // Prioritize first 6 images
                    />
                  ) : (
                    <div
                      className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors touch-manipulation"
                      onClick={() => onImageSelect?.(image.id)}
                    >
                      <div className="flex-shrink-0">
                        <ImageThumbnail
                          src={image.thumbnailUrl}
                          alt={image.title}
                          size="sm"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-100 font-medium truncate text-sm sm:text-base">
                          {image.title}
                        </h3>
                        <p className="text-gray-400 text-xs sm:text-sm truncate">
                          {image.category.name} • {image.uploadedBy.email}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(image.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}