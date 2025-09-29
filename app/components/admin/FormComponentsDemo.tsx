'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  FormInput, 
  FormTextarea, 
  FormSelect, 
  MultiSelectCategories,
  Button, 
  FormCard, 
  FormSection,
  LoadingSpinner,
  useToast 
} from '@/lib/components/ui'
import { Save, Eye, EyeOff } from 'lucide-react'

// Demo form schema
const demoFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.string().min(1, 'Category is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
})

type DemoFormData = z.infer<typeof demoFormSchema>

interface Category {
  id: string
  name: string
  imageCount?: number
}

const mockCategories: Category[] = [
  { id: '1', name: 'Photography', imageCount: 45 },
  { id: '2', name: 'Design', imageCount: 32 },
  { id: '3', name: 'Art', imageCount: 28 },
  { id: '4', name: 'Nature', imageCount: 67 },
  { id: '5', name: 'Technology', imageCount: 23 },
  { id: '6', name: 'Fashion', imageCount: 41 },
]

export default function FormComponentsDemo() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { success, error, info, warning } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      priority: 'medium',
      tags: []
    }
  })

  const onSubmit = async (data: DemoFormData) => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Form data:', { ...data, selectedCategories })
    
    success('Form submitted successfully!', 'All form components are working correctly.')
    setIsLoading(false)
  }

  const handleReset = () => {
    reset()
    setSelectedCategories([])
    info('Form reset', 'All fields have been cleared.')
  }

  const showToastExamples = () => {
    success('Success message', 'This is a success toast notification.')
    setTimeout(() => error('Error message', 'This is an error toast notification.'), 1000)
    setTimeout(() => warning('Warning message', 'This is a warning toast notification.'), 2000)
    setTimeout(() => info('Info message', 'This is an info toast notification.'), 3000)
  }

  return (
    <div className="space-y-8">
      {/* Toast Demo */}
      <FormCard title="Toast Notifications Demo">
        <div className="flex space-x-4">
          <Button onClick={showToastExamples}>
            Show All Toast Types
          </Button>
          <Button variant="secondary" onClick={() => success('Quick success!')}>
            Success Toast
          </Button>
          <Button variant="danger" onClick={() => error('Quick error!')}>
            Error Toast
          </Button>
        </div>
      </FormCard>

      {/* Main Form Demo */}
      <FormCard 
        title="Form Components Demo" 
        description="Demonstration of all reusable form components with validation and error handling"
        loading={isLoading}
        loadingText="Submitting form..."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Inputs Section */}
          <FormSection 
            title="Basic Input Components" 
            description="Standard form inputs with validation and error handling"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                {...register('title')}
                label="Title"
                placeholder="Enter a title"
                required
                error={errors.title?.message}
                helperText="This field is required and has a maximum length"
                loading={isLoading}
              />

              <FormInput
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="user@example.com"
                required
                error={errors.email?.message}
                loading={isLoading}
              />

              <div className="relative">
                <FormInput
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter password"
                  required
                  error={errors.password?.message}
                  loading={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <FormInput
                {...register('website')}
                type="url"
                label="Website"
                placeholder="https://example.com"
                error={errors.website?.message}
                helperText="Optional field with URL validation"
                loading={isLoading}
              />
            </div>

            <FormTextarea
              {...register('description')}
              label="Description"
              placeholder="Enter a description"
              rows={4}
              error={errors.description?.message}
              helperText="Optional field with character limit"
              loading={isLoading}
            />
          </FormSection>

          {/* Select Components Section */}
          <FormSection 
            title="Select Components" 
            description="Dropdown and multi-select components"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormSelect
                {...register('category')}
                label="Category"
                placeholder="Choose a category"
                required
                error={errors.category?.message}
                loading={isLoading}
              >
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="marketing">Marketing</option>
                <option value="business">Business</option>
              </FormSelect>

              <FormSelect
                {...register('priority')}
                label="Priority Level"
                required
                error={errors.priority?.message}
                loading={isLoading}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </FormSelect>
            </div>

            <MultiSelectCategories
              categories={mockCategories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              label="Multiple Categories"
              helperText="Select multiple categories using checkboxes"
              searchable
              showImageCount
              maxSelections={3}
              loading={isLoading}
            />
          </FormSection>

          {/* Loading States Section */}
          <FormSection 
            title="Loading States" 
            description="Various loading indicators and states"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-300">Small Spinner</h4>
                <LoadingSpinner size="sm" text="Loading..." />
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-300">Medium Spinner</h4>
                <LoadingSpinner size="md" text="Processing..." />
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-300">Large Spinner</h4>
                <LoadingSpinner size="lg" text="Please wait..." />
              </div>
            </div>
          </FormSection>

          {/* Button Variants Section */}
          <FormSection 
            title="Button Variants" 
            description="Different button styles and states"
          >
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button loading loadingText="Saving...">Loading Button</Button>
              <Button disabled>Disabled Button</Button>
            </div>
          </FormSection>

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-700">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset Form
            </Button>
            
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
              >
                Save Draft
              </Button>
              <Button
                type="submit"
                loading={isLoading}
                loadingText="Submitting..."
                icon={<Save className="h-4 w-4" />}
              >
                Submit Form
              </Button>
            </div>
          </div>
        </form>
      </FormCard>
    </div>
  )
}