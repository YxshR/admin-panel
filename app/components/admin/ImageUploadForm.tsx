'use client'

import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { adminImageUploadSchema, type AdminImageUploadInput } from '@/lib/validations'

// Form schema without file for react-hook-form
const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  categoryId: z.string().min(1, 'Category is required'),
})

type FormData = z.infer<typeof formSchema>

interface Category {
  id: string
  name: string
}

interface ImageUploadFormProps {
  categories: Category[]
  onSuccess?: (image: any) => void
  onError?: (error: string) => void
}

interface UploadProgress {
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
}

export default function ImageUploadForm({ 
  categories, 
  onSuccess, 
  onError 
}: ImageUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  })
  const [isDragOver, setIsDragOver] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: [],
    }
  })

  const watchedTags = watch('tags') || []

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file
    const validation = adminImageUploadSchema.pick({ file: true }).safeParse({ file })
    if (!validation.success) {
      onError?.(validation.error.issues[0]?.message || 'Invalid file')
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    
    // Auto-fill title from filename if empty
    const currentTitle = watch('title')
    if (!currentTitle) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setValue('title', nameWithoutExt)
    }
  }, [setValue, watch, onError])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Remove selected file
  const removeFile = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previewUrl])

  // Handle tag input
  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim()
      const currentTags = watch('tags') || []
      if (tag && !currentTags.includes(tag) && currentTags.length < 10) {
        setValue('tags', [...currentTags, tag])
        setTagInput('')
      }
    }
  }, [tagInput, setValue, watch])

  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    const currentTags = watch('tags') || []
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove))
  }, [setValue, watch])

  // Submit form
  const onSubmit = async (data: FormData) => {
    if (!selectedFile) {
      onError?.('Please select an image file')
      return
    }

    setUploadProgress({ progress: 0, status: 'uploading' })

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', data.title)
      if (data.description) {
        formData.append('description', data.description)
      }
      formData.append('categoryId', data.categoryId)
      formData.append('tags', JSON.stringify(data.tags || []))

      // Upload with progress tracking
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress({ progress, status: 'uploading' })
        }
      })

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          try {
            const result = JSON.parse(xhr.responseText)
            if (xhr.status >= 200 && xhr.status < 300 && result.success) {
              resolve(result.data)
            } else {
              // Provide more detailed error information
              let errorMessage = result.error || 'Upload failed'
              if (result.details) {
                if (Array.isArray(result.details)) {
                  // Validation errors
                  errorMessage += ': ' + result.details.map((d: any) => d.message).join(', ')
                } else if (typeof result.details === 'string') {
                  errorMessage += ': ' + result.details
                } else if (typeof result.details === 'object') {
                  // Multiple error sources
                  const detailMessages = Object.entries(result.details)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')
                  errorMessage += ': ' + detailMessages
                }
              }
              reject(new Error(errorMessage))
            }
          } catch (error) {
            reject(new Error('Invalid response from server. Please check your network connection.'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload. Please check your internet connection.'))
        })

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timeout. Please try again with a smaller file.'))
        })

        xhr.open('POST', '/api/admin/images')
        xhr.timeout = 60000 // 60 second timeout
        xhr.send(formData)
      })

      const result = await uploadPromise
      
      setUploadProgress({ progress: 100, status: 'success' })
      onSuccess?.(result)
      
      // Reset form
      reset()
      removeFile()
      setTagInput('')
      
    } catch (error) {
      console.error('Upload error:', error)
      setUploadProgress({ progress: 0, status: 'error' })
      onError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  const isUploading = uploadProgress.status === 'uploading'

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-6">Upload New Image</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-4">
          <label 
            htmlFor="image-file-input" 
            className="block text-sm font-medium text-gray-300"
          >
            Image File *
          </label>
          
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-900/20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="Upload image file by dragging and dropping or clicking to browse"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" aria-hidden="true" />
              <p className="text-gray-300 mb-2">
                Drag and drop your image here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded"
                  aria-describedby="file-upload-help"
                >
                  browse
                </button>
              </p>
              <p id="file-upload-help" className="text-sm text-gray-500">
                Supports JPEG, PNG, WebP, GIF up to 10MB
              </p>
              <input
                id="image-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileInputChange}
                className="sr-only"
                aria-describedby="file-upload-help"
              />
            </div>
          ) : (
            <div className="border border-gray-600 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                {previewUrl && (
                  <div className="flex-shrink-0 relative w-20 h-20">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {uploadProgress.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">
                          {uploadProgress.progress}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={isUploading}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-300 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="image-title" className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <input
            id="image-title"
            {...register('title')}
            type="text"
            className="w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] sm:min-h-0"
            placeholder="Enter image title"
            disabled={isUploading}
            aria-invalid={errors.title ? 'true' : 'false'}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="image-description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="image-description"
            {...register('description')}
            rows={3}
            className="w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
            placeholder="Enter image description"
            disabled={isUploading}
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={errors.description ? 'description-error' : undefined}
          />
          {errors.description && (
            <p id="description-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="image-category" className="block text-sm font-medium text-gray-300 mb-2">
            Category *
          </label>
          <select
            id="image-category"
            {...register('categoryId')}
            className="w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] sm:min-h-0"
            disabled={isUploading}
            aria-invalid={errors.categoryId ? 'true' : 'false'}
            aria-describedby={errors.categoryId ? 'category-error' : undefined}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p id="category-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="image-tags" className="block text-sm font-medium text-gray-300 mb-2">
            Tags
          </label>
          <div className="space-y-2">
            <input
              id="image-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] sm:min-h-0"
              placeholder="Type a tag and press Enter or comma"
              disabled={isUploading || watchedTags.length >= 10}
              aria-describedby="tags-help tags-count"
            />
            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2" role="list" aria-label="Selected tags">
                {watchedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-600 text-blue-100 text-sm rounded-md"
                    role="listitem"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      disabled={isUploading}
                      className="ml-1 text-blue-200 hover:text-blue-100 disabled:opacity-50 touch-manipulation p-1 -m-1 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 focus:ring-offset-blue-600 rounded"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <p id="tags-help">Press Enter or comma to add tags</p>
              <p id="tags-count" aria-live="polite">
                {watchedTags.length}/10 tags
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] sm:min-h-0"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                <span>Upload Image</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}