'use client'

import { useState, useCallback } from 'react'
import { z } from 'zod'

interface ValidationError {
  field: string
  message: string
}

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => Promise<void> | void
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

export function useFormValidation<T>({
  schema,
  onSubmit,
  onSuccess,
  onError
}: UseFormValidationOptions<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)

  const validateField = useCallback((field: string, value: any, formData?: any) => {
    try {
      // Use the full form data for validation, but only report errors for the specific field
      const dataToValidate = formData || { [field]: value }
      schema.parse(dataToValidate)
      
      // Clear error if validation passes
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues.find(issue => issue.path[0] === field)
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field]: fieldError.message
          }))
        }
      }
      return false
    }
  }, [schema])

  const validateForm = useCallback((data: any): data is T => {
    try {
      schema.parse(data)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach(issue => {
          const field = issue.path[0]
          if (field && typeof field === 'string') {
            newErrors[field] = issue.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }, [schema])

  const handleSubmit = useCallback(async (data: any) => {
    setSubmitCount(prev => prev + 1)
    
    if (!validateForm(data)) {
      onError?.('Please fix the validation errors')
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit(data)
      onSuccess?.(data)
      setErrors({})
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [validateForm, onSubmit, onSuccess, onError])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  return {
    errors,
    isSubmitting,
    submitCount,
    validateField,
    validateForm,
    handleSubmit,
    clearErrors,
    setFieldError,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0
  }
}