'use client'

import { useState, useEffect } from 'react'
import { X, Edit, Trash2, Download, Calendar, User, FolderOpen, Tag, FileText } from 'lucide-react'
import Image from 'next/image'
import ImageEditForm from './ImageEditForm'
import ConfirmationDialog from './ConfirmationDialog'

interface ImageDetailModalProps {
  image: {
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
  } | null
  categories: Array<{ id: string; name: string }>
  isOpen: boolean
  onClose: () => void
  onEdit: (updatedImage: any) => void
  onDelete: (imageId: string) => void
}

export default function ImageDetailModal({
  image,
  categories,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: ImageDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      setIsEditing(false)
      setShowDeleteConfirm(false)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !image) return null

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = image.originalUrl
    link.download = image.title
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = () => {
    onDelete(image.id)
    onClose()
  }

  const handleEditSuccess = (updatedImage: any) => {
    onEdit(updatedImage)
    setIsEditing(false)
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-100">
            {isEditing ? 'Edit Image' : 'Image Details'}
          </h2>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Download image"
                >
                  <Download className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Edit image"
                >
                  <Edit className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Delete image"
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {isEditing ? (
            <div className="p-6">
              <ImageEditForm
                image={image}
                categories={categories}
                onSuccess={handleEditSuccess}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Image Preview */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden">
                  <Image
                    src={image.originalUrl}
                    alt={`${image.title} - Full resolution image`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                
                {/* Image Actions */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => window.open(image.originalUrl, '_blank')}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <span>View Full Size</span>
                  </button>
                </div>
              </div>

              {/* Image Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-2">{image.title}</h3>
                  {image.description && (
                    <p className="text-gray-300 leading-relaxed">{image.description}</p>
                  )}
                </div>

                {/* Metadata */}
                <div className="space-y-4" role="region" aria-label="Image metadata">
                  <div className="flex items-center space-x-3 text-gray-300">
                    <FolderOpen className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span className="font-medium">Category:</span>
                    <span className="px-2 py-1 bg-blue-600 text-blue-100 rounded text-sm">
                      {image.category.name}
                    </span>
                  </div>

                  {image.tags.length > 0 && (
                    <div className="flex items-start space-x-3 text-gray-300">
                      <Tag className="h-5 w-5 text-gray-400 mt-0.5" aria-hidden="true" />
                      <div>
                        <span className="font-medium">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-2" role="list" aria-label="Image tags">
                          {image.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm"
                              role="listitem"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 text-gray-300">
                    <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span className="font-medium">File Size:</span>
                    <span>{formatFileSize(image.fileSize)}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-300">
                    <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span className="font-medium">Uploaded:</span>
                    <time dateTime={image.createdAt}>{formatDate(image.createdAt)}</time>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-300">
                    <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span className="font-medium">Uploaded by:</span>
                    <span>{image.uploadedBy.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteConfirm}
          title="Delete Image"
          message={`Are you sure you want to delete "${image.title}"? This action cannot be undone and will permanently remove the image from both the database and cloud storage.`}
          confirmText="Delete Image"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  )
}