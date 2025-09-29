'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Grid, List, Search, Filter, CheckSquare, Square } from 'lucide-react'
import ImageUploadForm from '@/app/components/admin/ImageUploadForm'
import ImageThumbnail from '@/app/components/admin/ImageThumbnail'
import ImageDetailModal from '@/app/components/admin/ImageDetailModal'
import BulkOperationsBar from '@/app/components/admin/BulkOperationsBar'

interface Category {
  id: string
  name: string
  _count: {
    images: number
  }
}

interface Image {
  id: string
  title: string
  description?: string
  tags: string[]
  thumbnailUrl: string
  originalUrl: string
  fileSize: number
  createdAt: string
  category: {
    id: string
    name: string
  }
  uploadedBy: {
    id: string
    email: string
  }
}

interface ImageManagementClientProps {
  categories: Category[]
}

export default function ImageManagementClient({ categories }: ImageManagementClientProps) {
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [showBulkSelection, setShowBulkSelection] = useState(false)
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Fetch images
  const fetchImages = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('categoryId', selectedCategory)
      
      const response = await fetch(`/api/admin/images?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setImages(result.data.images)
      } else {
        showNotification('error', 'Failed to fetch images')
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      showNotification('error', 'Failed to fetch images')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedCategory])

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Handle successful upload
  const handleUploadSuccess = (newImage: Image) => {
    setImages(prev => [newImage, ...prev])
    setShowUploadForm(false)
    showNotification('success', 'Image uploaded successfully!')
  }

  // Handle upload error
  const handleUploadError = (error: string) => {
    showNotification('error', error)
  }

  // Handle image view
  const handleImageView = (image: Image) => {
    setSelectedImage(image)
    setShowImageModal(true)
  }

  // Handle image edit
  const handleImageEdit = (image: Image) => {
    setSelectedImage(image)
    setShowImageModal(true)
  }

  // Handle image delete
  const handleImageDelete = async (image: Image) => {
    if (window.confirm(`Are you sure you want to delete "${image.title}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/admin/images/${image.id}`, {
          method: 'DELETE',
        })

        const result = await response.json()

        if (result.success) {
          setImages(prev => prev.filter(img => img.id !== image.id))
          showNotification('success', 'Image deleted successfully!')
        } else {
          showNotification('error', result.error || 'Failed to delete image')
        }
      } catch (error) {
        console.error('Error deleting image:', error)
        showNotification('error', 'Failed to delete image')
      }
    }
  }

  // Handle image selection
  const handleImageSelect = (imageId: string, selected: boolean) => {
    setSelectedImages(prev => 
      selected 
        ? [...prev, imageId]
        : prev.filter(id => id !== imageId)
    )
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(images.map(img => img.id))
    }
  }

  // Handle bulk operations
  const handleBulkAction = async (action: string, data?: any) => {
    try {
      const response = await fetch('/api/admin/images/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          imageIds: selectedImages,
          ...data,
        }),
      })

      const result = await response.json()

      if (result.success) {
        showNotification('success', result.message || 'Operation completed successfully!')
        
        // Refresh images after bulk operation
        await fetchImages()
        setSelectedImages([])
        
        if (action === 'delete') {
          setShowBulkSelection(false)
        }
      } else {
        showNotification('error', result.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error)
      showNotification('error', 'Operation failed')
    }
  }

  // Handle modal edit success
  const handleModalEdit = (updatedImage: Image) => {
    setImages(prev => prev.map(img => 
      img.id === updatedImage.id ? updatedImage : img
    ))
    showNotification('success', 'Image updated successfully!')
  }

  // Handle modal delete
  const handleModalDelete = async (imageId: string) => {
    try {
      const response = await fetch(`/api/admin/images/${imageId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setImages(prev => prev.filter(img => img.id !== imageId))
        showNotification('success', 'Image deleted successfully!')
      } else {
        showNotification('error', result.error || 'Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      showNotification('error', 'Failed to delete image')
    }
  }

  useEffect(() => {
    fetchImages()
  }, [searchTerm, selectedCategory, fetchImages])

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-900 border border-green-700 text-green-100' 
            : 'bg-red-900 border border-red-700 text-red-100'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-100">Upload New Image</h2>
            <button
              onClick={() => setShowUploadForm(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
          <ImageUploadForm
            categories={categories.map(cat => ({ id: cat.id, name: cat.name }))}
            onSuccess={handleUploadSuccess}
            onError={handleUploadError}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          {!showUploadForm && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 touch-manipulation min-h-[44px] sm:min-h-0"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Image</span>
            </button>
          )}
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 sm:p-2 rounded-lg touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                viewMode === 'grid' 
                  ? 'bg-gray-700 text-gray-100' 
                  : 'text-gray-400 hover:text-gray-300 active:bg-gray-700'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 sm:p-2 rounded-lg touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                viewMode === 'list' 
                  ? 'bg-gray-700 text-gray-100' 
                  : 'text-gray-400 hover:text-gray-300 active:bg-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {images.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowBulkSelection(!showBulkSelection)
                  setSelectedImages([])
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  showBulkSelection
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {showBulkSelection ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                <span>Select</span>
              </button>

              {showBulkSelection && images.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {selectedImages.length === images.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 min-h-[44px] sm:min-h-0"
            />
          </div>

          {/* Category Filter */}
          <div className="relative flex-shrink-0 w-full sm:w-auto min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-8 py-3 sm:py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 appearance-none min-h-[44px] sm:min-h-0"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category._count.images})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Images Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No images found</p>
          {!showUploadForm && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Upload your first image
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6'
            : 'space-y-3 sm:space-y-4'
        }>
          {images.map((image) => (
            <ImageThumbnail
              key={image.id}
              {...image}
              onView={handleImageView}
              onEdit={handleImageEdit}
              onDelete={handleImageDelete}
              className={viewMode === 'list' ? 'flex-row' : ''}
              showSelection={showBulkSelection}
              isSelected={selectedImages.includes(image.id)}
              onSelect={handleImageSelect}
            />
          ))}
        </div>
      )}

      {/* Image Detail Modal */}
      <ImageDetailModal
        image={selectedImage}
        categories={categories.map(cat => ({ id: cat.id, name: cat.name }))}
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false)
          setSelectedImage(null)
        }}
        onEdit={handleModalEdit}
        onDelete={handleModalDelete}
      />

      {/* Bulk Operations Bar */}
      <BulkOperationsBar
        selectedImages={selectedImages}
        categories={categories.map(cat => ({ id: cat.id, name: cat.name }))}
        onClearSelection={() => setSelectedImages([])}
        onBulkAction={handleBulkAction}
      />
    </div>
  )
}