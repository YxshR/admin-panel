'use client'

import { useState } from 'react'
import { 
  MultiSelectCategories, 
  Button, 
  FormCard,
  useToast 
} from '@/lib/components/ui'

interface Category {
  id: string
  name: string
  imageCount?: number
}

interface BulkCategoryAssignmentProps {
  categories: Category[]
  selectedImages: string[]
  onSuccess?: () => void
  onCancel?: () => void
}

export default function BulkCategoryAssignment({
  categories,
  selectedImages,
  onSuccess,
  onCancel
}: BulkCategoryAssignmentProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      error('No categories selected', 'Please select at least one category to assign.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/images/bulk-assign-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageIds: selectedImages,
          categoryIds: selectedCategories
        }),
      })

      const result = await response.json()

      if (result.success) {
        success(
          'Categories assigned successfully', 
          `${selectedImages.length} images have been assigned to ${selectedCategories.length} categories.`
        )
        onSuccess?.()
      } else {
        error('Assignment failed', result.error || 'Failed to assign categories')
      }
    } catch (err) {
      console.error('Error assigning categories:', err)
      error('Assignment failed', 'An error occurred while assigning categories')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormCard
      title="Bulk Category Assignment"
      description={`Assign categories to ${selectedImages.length} selected images`}
      loading={isSubmitting}
      loadingText="Assigning categories..."
    >
      <div className="space-y-6">
        <MultiSelectCategories
          categories={categories}
          selected={selectedCategories}
          onChange={setSelectedCategories}
          label="Select Categories"
          helperText="Choose one or more categories to assign to the selected images"
          searchable
          showImageCount
          loading={isSubmitting}
        />

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedCategories.length === 0}
            loading={isSubmitting}
            loadingText="Assigning..."
          >
            Assign Categories
          </Button>
        </div>
      </div>
    </FormCard>
  )
}