'use client'

import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { 
  FormInput, 
  FormTextarea, 
  FormSelect, 
  Button, 
  FormCard, 
  FormSection,
  useToast 
} from '@/lib/components/ui'
import { imageUploadSchema, type ImageUploadData } from '@/lib/utils/formValidation'
import { useFormValidation } from '@/lib/hooks/useFormValidation'

interface Category {
  id: string
  name: string
}

interface ImprovedImageUploadFormProps {
  categories: Category[]
  onSuccess?: (image: any) => void
}

interface UploadProgress {
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
}

export default function ImprovedImageUploadForm({ 
  categories, 
  onSuccess 
}: ImprovedImageUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  })
  const [isDragOver, setIsDragOver] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { success, error: showError } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<Omit<ImageUploadData, 'file'>>({
    resolver: zodResolver(imageUploadSchema.omit({ file: true })),
    defaultValues: {
      tags: [],
    }
  })

  const {
    errors: validationErrors,
    isSubmitting,
    handleSubmit: handleValidatedSubmit,
    setFieldError
  } = useFormValidation({
    schema: imageUploadSchema,
    onSubmit: async (data) => {
      await uploadImage(data)
    },
    onSuccess: (data) => {
      success('Image uploaded successfully', 'Your image has been uploaded and is now available.')
      onSuccess?.(data)
      resetForm()
    },
    onError: (errorMessage) => {
      showError('Upload failed', errorMessage)
    }
  })

  const watchedTags = watch('tags') || []

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file using our schema
    const validation = imageUploadSchema.pick({ file: true }).safeParse({ file })
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid file'
      setFieldError('file', errorMessage)
      showError('Invalid file', errorMessage)
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
  }, [setValue, watch, setFieldError, showError])

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

  // Upload image function
  const uploadImage = async (data: ImageUploadData) => {
    if (!selectedFile) {
      throw new Error('Please select an image file')
    }

    setUploadProgress({ progress: 0, status: 'uploading' })

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

    return new Promise<any>((resolve, reject) => {
      xhr.addEventListener('load', () => {
        try {
          const result = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300 && result.success) {
            setUploadProgress({ progress: 100, status: 'success' })
            resolve(result.data)
          } else {
            setUploadProgress({ progress: 0, status: 'error' })
            reject(new Error(result.error || 'Upload failed'))
          }
        } catch (error) {
          setUploadProgress({ progress: 0, status: 'error' })
          reject(new Error('Invalid response from server'))
        }
      })

      xhr.addEventListener('error', () => {
        setUploadProgress({ progress: 0, status: 'error' })
        reject(new Error('Network error during upload'))
      })

      xhr.open('POST', '/api/admin/images')
      xhr.send(formData)
    })
  }

  // Reset form
  const resetForm = useCallback(() => {
    reset()
    removeFile()
    setTagInput('')
    setUploadProgress({ progress: 0, status: 'idle' })
  }, [reset, removeFile])

  // Submit form
  const onSubmit = (formData: Omit<ImageUploadData, 'file'>) => {
    if (!selectedFile) {
      showError('No file selected', 'Please select an image file to upload')
      return
    }

    const fullData: ImageUploadData = {
      ...formData,
      file: selectedFile
    }

    handleValidatedSubmit(fullData)
  }

  const isUploading = uploadProgress.status === 'uploading' || isSubmitting

  return (
    <FormCard 
      title="Upload New Image" 
      description="Add a new image to your collection with metadata and categorization"
      loading={isUploading}
      loadingText="Uploading image..."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* File Upload Section */}
        <FormSection title="Image File" description="Select an image file to upload">
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
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-300 mb-2">
                Drag and drop your image here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500">
                Supports JPEG, PNG, WebP, GIF up to 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
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
          {validationErrors.file && (
            <p className="text-sm text-red-400 flex items-center mt-2">
              <span className="mr-1">⚠</span>
              {validationErrors.file}
            </p>
          )}
        </FormSection>

        {/* Image Details Section */}
        <FormSection title="Image Details" description="Provide information about your image">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              {...register('title')}
              label="Title"
              placeholder="Enter image title"
              required
              error={errors.title?.message || validationErrors.title}
              loading={isUploading}
            />

            <FormSelect
              {...register('categoryId')}
              label="Category"
              placeholder="Select a category"
              required
              error={errors.categoryId?.message || validationErrors.categoryId}
              loading={isUploading}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </FormSelect>
          </div>

          <FormTextarea
            {...register('description')}
            label="Description"
            placeholder="Enter image description"
            rows={3}
            error={errors.description?.message || validationErrors.description}
            loading={isUploading}
          />

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Tags
            </label>
            <FormInput
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Type a tag and press Enter"
              disabled={isUploading || watchedTags.length >= 10}
              helperText={`${watchedTags.length}/10 tags`}
            />
            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-600 text-blue-100 text-sm rounded-md"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      disabled={isUploading}
                      className="ml-1 text-blue-200 hover:text-blue-100 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </FormSection>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button
            type="submit"
            disabled={!selectedFile}
            loading={isUploading}
            loadingText="Uploading..."
            icon={<ImageIcon className="h-4 w-4" />}
          >
            Upload Image
          </Button>
        </div>
      </form>
    </FormCard>
  )
}