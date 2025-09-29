'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, Eye, Download, Trash2, Edit, Check } from 'lucide-react'
import ConfirmationDialog from './ConfirmationDialog'

interface ImageThumbnailProps {
  id: string
  title: string
  thumbnailUrl: string
  originalUrl: string
  fileSize: number
  category?: {
    id: string
    name: string
  }
  uploadedBy?: {
    id: string
    email: string
  }
  createdAt: string
  onView?: (image: any) => void
  onEdit?: (image: any) => void
  onDelete?: (image: any) => void
  className?: string
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  showSelection?: boolean
}

export default function ImageThumbnail({
  id,
  title,
  thumbnailUrl,
  originalUrl,
  fileSize,
  category,
  uploadedBy,
  createdAt,
  onView,
  onEdit,
  onDelete,
  className = '',
  isSelected = false,
  onSelect,
  showSelection = false,
}: ImageThumbnailProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = originalUrl
    link.download = title
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const imageData = {
    id,
    title,
    thumbnailUrl,
    originalUrl,
    fileSize,
    category,
    uploadedBy,
    createdAt,
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    onDelete?.(imageData)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Image"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone and will permanently remove the image from both the database and cloud storage.`}
        confirmText="Delete Image"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      
      <div className={`bg-gray-800 rounded-lg overflow-hidden border transition-colors ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-700 hover:border-gray-600'
      } ${className}`}>
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-900 group">
          {!imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true)
                  setImageLoaded(true)
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-gray-600" />
            </div>
          )}

          {/* Selection Checkbox */}
          {showSelection && (
            <div className="absolute top-2 left-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.(id, !isSelected)
                }}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-gray-800 bg-opacity-75 border-gray-400 hover:border-blue-400'
                }`}
              >
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            </div>
          )}

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              {onView && (
                <button
                  onClick={() => onView(imageData)}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="View image"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleDownload}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Download image"
              >
                <Download className="h-4 w-4" />
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(imageData)}
                  className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  title="Edit image"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  title="Delete image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Image Info */}
        <div className="p-4">
          <h3 className="text-gray-100 font-medium truncate mb-2" title={title}>
            {title}
          </h3>
          
          <div className="space-y-1 text-sm text-gray-400">
            {category && (
              <div className="flex items-center justify-between">
                <span>Category:</span>
                <span className="text-blue-400">{category.name}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span>Size:</span>
              <span>{formatFileSize(fileSize)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Uploaded:</span>
              <span>{formatDate(createdAt)}</span>
            </div>
            
            {uploadedBy && (
              <div className="flex items-center justify-between">
                <span>By:</span>
                <span className="truncate max-w-24" title={uploadedBy.email}>
                  {uploadedBy.email}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}