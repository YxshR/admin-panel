'use client'

import React from 'react'
import { z } from 'zod'
import { useEnhancedForm } from '@/lib/hooks/useEnhancedForm'
import { FormField, FormTextarea } from '@/lib/components/FormField'
import { FormErrorBoundary } from '@/lib/components/ErrorBoundary'
import { useSuccessToast, useErrorToast } from '@/lib/components/Toast'
import { api } from '@/lib/api-client'
import { Save, Loader2 } from 'lucide-react'

// Form validation schema
const categoryFormSchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be less than 50 characters')
    .trim()
    .refine(name => name.length > 0, 'Category name cannot be empty'),
  description: z.string()
    .max(200, 'Description must be less than 200 characters')
    .optional()
})

type CategoryFormData = z.infer<typeof categoryFormSchema>

interface CategoryFormExampleProps {
  initialData?: Partial<CategoryFormData>
  categoryId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CategoryFormExample({
  initialData = {},
  categoryId,
  onSuccess,
  onCancel
}: CategoryFormExampleProps) {
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const form = useEnhancedForm<CategoryFormData>({
    schema: categoryFormSchema,
    initialValues: {
      name: initialData.name || '',
      description: initialData.description || ''
    },
    validateOnBlur: true,
    validateOnChange: false,
    resetOnSuccess: !categoryId, // Reset only for new categories
    retryOptions: {
      maxAttempts: 3,
      retryOn: 'network'
    },
    onSubmit: async (data) => {
      if (categoryId) {
        // Update existing category
        await api.updateCategory(categoryId, data)
      } else {
        // Create new category
        await api.createCategory(data)
      }
    },
    onSuccess: (data) => {
      const action = categoryId ? 'updated' : 'created'
      successToast(
        `Category ${action}`,
        `"${data.name}" has been ${action} successfully.`
      )
      onSuccess?.()
    },
    onError: (error, details) => {
      console.error('Form submission error:', error, details)
      
      // Handle specific API errors
      if (details?.code === 'CONFLICT') {
        form.setFieldError('name', 'A category with this name already exists')
        errorToast('Duplicate Category', 'Please choose a different name.')
      } else if (details?.code === 'VALIDATION_ERROR') {
        // Handle validation errors from API
        if (details.details && Array.isArray(details.details)) {
          details.details.forEach((issue: any) => {
            if (issue.field && issue.message) {
              form.setFieldError(issue.field as keyof CategoryFormData, issue.message)
            }
          })
        }
        errorToast('Validation Error', 'Please check the form for errors.')
      } else {
        errorToast('Submission Failed', error)
      }
    }
  })

  const handleRetry = () => {
    if (form.retryState.canRetry) {
      form.retry(form.values)
    }
  }

  return (
    <FormErrorBoundary
      onError={(error) => {
        console.error('Form component error:', error)
        errorToast('Form Error', 'An unexpected error occurred in the form.')
      }}
    >
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-6">
          {categoryId ? 'Edit Category' : 'Create New Category'}
        </h2>

        <form onSubmit={form.handleSubmit} className="space-y-6">
          <FormField
            label="Category Name"
            placeholder="Enter category name"
            required
            schema={z.string().min(1).max(50)}
            validateOnBlur
            {...form.getFieldProps('name')}
          />

          <FormTextarea
            label="Description"
            placeholder="Enter category description (optional)"
            rows={3}
            schema={z.string().max(200).optional()}
            validateOnBlur
            {...form.getFieldProps('description')}
          />

          {/* Error summary */}
          {form.hasErrors && form.submitCount > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-red-400 font-medium mb-2">Please fix the following errors:</h4>
              <ul className="text-red-300 text-sm space-y-1">
                {Object.entries(form.errors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Retry notification */}
          {form.retryState.canRetry && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-yellow-400 font-medium">Submission Failed</h4>
                  <p className="text-yellow-300 text-sm">
                    The form submission failed. You can try again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Form actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={form.isSubmitting || form.hasErrors}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              {form.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {form.retryState.isRetrying ? 'Retrying...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {categoryId ? 'Update Category' : 'Create Category'}
                </>
              )}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={form.isSubmitting}
                className="px-4 py-2 text-gray-300 hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
            )}

            {form.isDirty && !form.isSubmitting && (
              <button
                type="button"
                onClick={() => form.reset()}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Form state debug info (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6">
              <summary className="text-gray-400 cursor-pointer text-sm">
                Debug Info (Development)
              </summary>
              <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-auto">
                {JSON.stringify({
                  values: form.values,
                  errors: form.errors,
                  isDirty: form.isDirty,
                  hasErrors: form.hasErrors,
                  isSubmitting: form.isSubmitting,
                  submitCount: form.submitCount,
                  retryState: form.retryState
                }, null, 2)}
              </pre>
            </details>
          )}
        </form>
      </div>
    </FormErrorBoundary>
  )
}