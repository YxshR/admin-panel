'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  description: string | null
  imageCount: number
  createdAt: string
  updatedAt: string
}

interface CategoryDeleteModalProps {
  category: Category
  categories: Category[]
  onConfirm: (reassignToCategoryId?: string) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function CategoryDeleteModal({
  category,
  categories,
  onConfirm,
  onCancel,
  isLoading = false
}: CategoryDeleteModalProps) {
  const [reassignToCategoryId, setReassignToCategoryId] = useState<string>('')
  const [showReassignOptions, setShowReassignOptions] = useState(false)

  // Filter out the category being deleted
  const availableCategories = categories.filter(cat => cat.id !== category.id)

  useEffect(() => {
    setShowReassignOptions(category.imageCount > 0)
  }, [category.imageCount])

  const handleConfirm = async () => {
    if (category.imageCount > 0 && !reassignToCategoryId) {
      return // Don't proceed if images exist but no reassignment category selected
    }
    await onConfirm(reassignToCategoryId || undefined)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          Delete Category
        </h2>

        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            Are you sure you want to delete the category &ldquo;{category.name}&rdquo;?
          </p>
          
          {category.imageCount > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-md p-3 mt-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-400">
                    Warning: Category has {category.imageCount} image{category.imageCount !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-yellow-300 mt-1">
                    You must reassign these images to another category before deletion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showReassignOptions && (
            <div className="mt-4">
              <label htmlFor="reassignCategory" className="block text-sm font-medium text-gray-300 mb-2">
                Reassign images to:
              </label>
              <select
                id="reassignCategory"
                value={reassignToCategoryId}
                onChange={(e) => setReassignToCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">Select a category...</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.imageCount} images)
                  </option>
                ))}
              </select>
              {availableCategories.length === 0 && (
                <p className="text-sm text-red-400 mt-2">
                  No other categories available. Please create another category first.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={
              isLoading || 
              (category.imageCount > 0 && (!reassignToCategoryId || availableCategories.length === 0))
            }
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deleting...' : 'Delete Category'}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}