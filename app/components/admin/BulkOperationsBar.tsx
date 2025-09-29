'use client'

import { useState } from 'react'
import { Trash2, FolderOpen, Tag, X, Check } from 'lucide-react'
import ConfirmationDialog from './ConfirmationDialog'

interface BulkOperationsBarProps {
  selectedImages: string[]
  categories: Array<{ id: string; name: string }>
  onClearSelection: () => void
  onBulkAction: (action: string, data?: any) => Promise<void>
}

export default function BulkOperationsBar({
  selectedImages,
  categories,
  onClearSelection,
  onBulkAction
}: BulkOperationsBarProps) {
  const [showCategorySelect, setShowCategorySelect] = useState(false)
  const [showTagInput, setShowTagInput] = useState<'add' | 'remove' | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (selectedImages.length === 0) return null

  const handleBulkDelete = async () => {
    setLoading(true)
    try {
      await onBulkAction('delete')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCategoryUpdate = async () => {
    if (!selectedCategory) return
    
    setLoading(true)
    try {
      await onBulkAction('updateCategory', { categoryId: selectedCategory })
      setShowCategorySelect(false)
      setSelectedCategory('')
    } finally {
      setLoading(false)
    }
  }

  const handleTagAction = async (action: 'add' | 'remove') => {
    if (!tagInput.trim()) return

    const tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean)
    if (tags.length === 0) return

    setLoading(true)
    try {
      await onBulkAction(action === 'add' ? 'addTags' : 'removeTags', { tags })
      setShowTagInput(null)
      setTagInput('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Images"
        message={`Are you sure you want to delete ${selectedImages.length} selected images? This action cannot be undone and will permanently remove all selected images from both the database and cloud storage.`}
        confirmText={`Delete ${selectedImages.length} Images`}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-center space-x-4">
          {/* Selection Info */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-300 font-medium">
              {selectedImages.length} selected
            </span>
            <button
              onClick={onClearSelection}
              className="p-1 text-gray-400 hover:text-gray-300 rounded"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-600" />

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              title="Delete selected images"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>

            {/* Change Category */}
            <div className="relative">
              <button
                onClick={() => setShowCategorySelect(!showCategorySelect)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Change category"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Category</span>
              </button>

              {showCategorySelect && (
                <div className="absolute bottom-full mb-2 left-0 bg-gray-700 border border-gray-600 rounded-lg shadow-lg p-3 min-w-48">
                  <div className="space-y-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowCategorySelect(false)}
                        className="flex-1 px-2 py-1 text-gray-400 hover:text-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCategoryUpdate}
                        disabled={!selectedCategory || loading}
                        className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Tags */}
            <div className="relative">
              <button
                onClick={() => setShowTagInput(showTagInput === 'add' ? null : 'add')}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Add tags"
              >
                <Tag className="h-4 w-4" />
                <span>Add Tags</span>
              </button>

              {showTagInput === 'add' && (
                <div className="absolute bottom-full mb-2 left-0 bg-gray-700 border border-gray-600 rounded-lg shadow-lg p-3 min-w-64">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Enter tags separated by commas"
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-400"
                      onKeyPress={(e) => e.key === 'Enter' && handleTagAction('add')}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowTagInput(null)}
                        className="flex-1 px-2 py-1 text-gray-400 hover:text-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleTagAction('add')}
                        disabled={!tagInput.trim() || loading}
                        className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Remove Tags */}
            <div className="relative">
              <button
                onClick={() => setShowTagInput(showTagInput === 'remove' ? null : 'remove')}
                className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                title="Remove tags"
              >
                <Tag className="h-4 w-4" />
                <span>Remove Tags</span>
              </button>

              {showTagInput === 'remove' && (
                <div className="absolute bottom-full mb-2 right-0 bg-gray-700 border border-gray-600 rounded-lg shadow-lg p-3 min-w-64">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Enter tags to remove (comma separated)"
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-400"
                      onKeyPress={(e) => e.key === 'Enter' && handleTagAction('remove')}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowTagInput(null)}
                        className="flex-1 px-2 py-1 text-gray-400 hover:text-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleTagAction('remove')}
                        disabled={!tagInput.trim() || loading}
                        className="flex-1 px-2 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  )
}