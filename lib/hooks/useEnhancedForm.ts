'use client'

import { useState, useCallback, useRef } from 'react'
import { z } from 'zod'
import { useApiRetry } from './useRetry'
import { isApiError } from '../api-error-handler'

interface FormField {
  value: any
  error?: string
  touched: boolean
  dirty: boolean
}

interface FormState<T> {
  fields: Record<keyof T, FormField>
  isSubmitting: boolean
  isValidating: boolean
  submitCount: number
  hasErrors: boolean
  isDirty: boolean
}

interface UseEnhancedFormOptions<T> {
  schema: z.ZodSchema<T>
  initialValues: T
  onSubmit: (data: T) => Promise<void>
  onSuccess?: (data: T) => void
  onError?: (error: string, details?: any) => void
  validateOnChange?: boolean
  validateOnBlur?: boolean
  resetOnSuccess?: boolean
  retryOptions?: {
    maxAttempts?: number
    retryOn?: 'network' | 'server' | 'all'
  }
}

export function useEnhancedForm<T extends Record<string, any>>({
  schema,
  initialValues,
  onSubmit,
  onSuccess,
  onError,
  validateOnChange = false,
  validateOnBlur = true,
  resetOnSuccess = false,
  retryOptions = {}
}: UseEnhancedFormOptions<T>) {
  // Initialize form state
  const [state, setState] = useState<FormState<T>>(() => ({
    fields: Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = {
        value: initialValues[key as keyof T],
        touched: false,
        dirty: false
      }
      return acc
    }, {} as Record<keyof T, FormField>),
    isSubmitting: false,
    isValidating: false,
    submitCount: 0,
    hasErrors: false,
    isDirty: false
  }))

  const initialValuesRef = useRef(initialValues)

  // Set up retry mechanism for form submission
  const { execute: executeSubmit, retry: retrySubmit, state: retryState } = useApiRetry(
    onSubmit,
    {
      maxAttempts: retryOptions.maxAttempts || 3,
      retryOn: retryOptions.retryOn || 'network',
      onRetry: (attempt, error) => {
        onError?.(`Submission failed (attempt ${attempt}). Retrying...`, error.message)
      },
      onMaxAttemptsReached: (error) => {
        onError?.('Submission failed after multiple attempts', error.message)
      }
    }
  )

  // Validate a single field
  const validateField = useCallback((fieldName: keyof T, value: any): string | undefined => {
    try {
      // Create a partial object for validation
      const testObject = { [fieldName]: value } as Partial<T>
      schema.parse(testObject)
      return undefined
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues.find(issue => issue.path[0] === fieldName)
        return fieldError?.message
      }
      return 'Invalid value'
    }
  }, [schema])

  // Validate entire form
  const validateForm = useCallback((values: T): Record<keyof T, string> | null => {
    try {
      schema.parse(values)
      return null
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.issues.forEach(issue => {
          const field = issue.path[0]
          if (field && typeof field === 'string') {
            errors[field] = issue.message
          }
        })
        return errors as Record<keyof T, string>
      }
      return null
    }
  }, [schema])

  // Get current form values
  const getValues = useCallback((): T => {
    return Object.keys(state.fields).reduce((acc, key) => {
      acc[key as keyof T] = state.fields[key as keyof T].value
      return acc
    }, {} as T)
  }, [state.fields])

  // Set field value
  const setValue = useCallback((fieldName: keyof T, value: any, options?: { 
    shouldValidate?: boolean
    shouldTouch?: boolean 
  }) => {
    setState(prev => {
      const field = prev.fields[fieldName]
      const isDirty = value !== initialValuesRef.current[fieldName]
      
      let error = field.error
      if (options?.shouldValidate || (validateOnChange && field.touched)) {
        error = validateField(fieldName, value)
      }

      const newFields = {
        ...prev.fields,
        [fieldName]: {
          ...field,
          value,
          dirty: isDirty,
          touched: options?.shouldTouch ?? field.touched,
          error
        }
      }

      const hasErrors = Object.values(newFields).some(f => f.error)
      const formIsDirty = Object.values(newFields).some(f => f.dirty)

      return {
        ...prev,
        fields: newFields,
        hasErrors,
        isDirty: formIsDirty
      }
    })
  }, [validateField, validateOnChange])

  // Set field error
  const setFieldError = useCallback((fieldName: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          error
        }
      },
      hasErrors: true
    }))
  }, [])

  // Clear field error
  const clearFieldError = useCallback((fieldName: keyof T) => {
    setState(prev => {
      const newFields = {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          error: undefined
        }
      }
      
      const hasErrors = Object.values(newFields).some(f => f.error)
      
      return {
        ...prev,
        fields: newFields,
        hasErrors
      }
    })
  }, [])

  // Touch field
  const touchField = useCallback((fieldName: keyof T) => {
    setState(prev => {
      let error = prev.fields[fieldName].error
      if (validateOnBlur) {
        error = validateField(fieldName, prev.fields[fieldName].value)
      }

      return {
        ...prev,
        fields: {
          ...prev.fields,
          [fieldName]: {
            ...prev.fields[fieldName],
            touched: true,
            error
          }
        }
      }
    })
  }, [validateField, validateOnBlur])

  // Reset form
  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = { ...initialValues, ...newValues }
    
    setState({
      fields: Object.keys(resetValues).reduce((acc, key) => {
        acc[key as keyof T] = {
          value: resetValues[key as keyof T],
          touched: false,
          dirty: false
        }
        return acc
      }, {} as Record<keyof T, FormField>),
      isSubmitting: false,
      isValidating: false,
      submitCount: 0,
      hasErrors: false,
      isDirty: false
    })

    if (newValues) {
      initialValuesRef.current = resetValues
    }
  }, [initialValues])

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    setState(prev => ({
      ...prev,
      isSubmitting: true,
      submitCount: prev.submitCount + 1
    }))

    try {
      const values = getValues()
      
      // Validate entire form
      const errors = validateForm(values)
      if (errors) {
        setState(prev => ({
          ...prev,
          fields: Object.keys(errors).reduce((acc, key) => {
            acc[key as keyof T] = {
              ...prev.fields[key as keyof T],
              error: errors[key as keyof T],
              touched: true
            }
            return acc
          }, { ...prev.fields }),
          isSubmitting: false,
          hasErrors: true
        }))
        
        onError?.('Please fix the validation errors')
        return
      }

      // Submit form with retry mechanism
      await executeSubmit(values)
      
      onSuccess?.(values)
      
      if (resetOnSuccess) {
        reset()
      }
      
    } catch (error) {
      let errorMessage = 'An error occurred while submitting the form'
      let errorDetails: any = undefined

      if (error instanceof Error) {
        errorMessage = error.message
        
        // Handle API errors
        if (isApiError(error)) {
          errorDetails = error
        }
      }

      onError?.(errorMessage, errorDetails)
    } finally {
      setState(prev => ({
        ...prev,
        isSubmitting: false
      }))
    }
  }, [getValues, validateForm, executeSubmit, onSuccess, onError, reset, resetOnSuccess])

  // Get field props for easy integration with form components
  const getFieldProps = useCallback((fieldName: keyof T) => {
    const field = state.fields[fieldName]
    
    return {
      value: field.value,
      error: field.touched ? field.error : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(fieldName, e.target.value)
      },
      onBlur: () => {
        touchField(fieldName)
      }
    }
  }, [state.fields, setValue, touchField])

  // Get field state
  const getFieldState = useCallback((fieldName: keyof T) => {
    return state.fields[fieldName]
  }, [state.fields])

  return {
    // Form state
    values: getValues(),
    errors: Object.keys(state.fields).reduce((acc, key) => {
      const field = state.fields[key as keyof T]
      if (field.error && field.touched) {
        acc[key as keyof T] = field.error
      }
      return acc
    }, {} as Partial<Record<keyof T, string>>),
    isSubmitting: state.isSubmitting || retryState.isRetrying,
    isValidating: state.isValidating,
    isDirty: state.isDirty,
    hasErrors: state.hasErrors,
    submitCount: state.submitCount,
    
    // Retry state
    retryState,
    
    // Field methods
    setValue,
    setFieldError,
    clearFieldError,
    touchField,
    getFieldProps,
    getFieldState,
    
    // Form methods
    handleSubmit,
    reset,
    retry: retrySubmit,
    validateForm: () => validateForm(getValues()),
    
    // Validation methods
    validateField: (fieldName: keyof T) => {
      const field = state.fields[fieldName]
      return validateField(fieldName, field.value)
    }
  }
}