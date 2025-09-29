import { z } from 'zod'

export const commonValidations = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
}

export const fileValidation = {
  image: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'File must be a valid image (JPEG, PNG, WebP, or GIF)'
    ),
  document: z.instanceof(File)
    .refine(file => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB')
    .refine(
      file => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
      'File must be a valid document (PDF, DOC, or DOCX)'
    )
}

export const imageUploadSchema = z.object({
  title: commonValidations.title,
  description: commonValidations.description,
  categoryId: commonValidations.categoryId,
  tags: commonValidations.tags,
  file: fileValidation.image
})

export const imageEditSchema = z.object({
  title: commonValidations.title,
  description: commonValidations.description,
  categoryId: commonValidations.categoryId,
  tags: commonValidations.tags
})

export const categorySchema = z.object({
  name: commonValidations.name,
  description: commonValidations.description
})

export const userSchema = z.object({
  email: commonValidations.email,
  password: commonValidations.password,
  role: z.enum(['ADMIN', 'EDITOR'], {
    message: 'Role must be either Admin or Editor'
  }),
  status: z.enum(['ACTIVE', 'DISABLED'], {
    message: 'Status must be either Active or Disabled'
  })
})

export const userEditSchema = userSchema.extend({
  password: commonValidations.password.optional()
})

export const profileSchema = z.object({
  email: commonValidations.email,
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: commonValidations.password.optional(),
  confirmPassword: z.string().optional()
}).refine(
  data => !data.newPassword || data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
)

export const settingsSchema = z.object({
  cloudinaryCloudName: z.string().min(1, 'Cloudinary cloud name is required'),
  cloudinaryApiKey: z.string().min(1, 'Cloudinary API key is required'),
  cloudinaryApiSecret: z.string().min(1, 'Cloudinary API secret is required'),
  maxFileSize: z.number().min(1, 'Max file size must be at least 1MB').max(100, 'Max file size cannot exceed 100MB'),
  allowedFileTypes: z.array(z.string()).min(1, 'At least one file type must be allowed')
})

// Validation helper functions
export function validateEmail(email: string): boolean {
  return commonValidations.email.safeParse(email).success
}

export function validatePassword(password: string): boolean {
  return commonValidations.password.safeParse(password).success
}

export function getPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score += 1
  else feedback.push('Use at least 8 characters')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Include uppercase letters')

  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Include lowercase letters')

  if (/[0-9]/.test(password)) score += 1
  else feedback.push('Include numbers')

  if (/[^A-Za-z0-9]/.test(password)) score += 1
  else feedback.push('Include special characters')

  return { score, feedback }
}

export function formatValidationError(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  
  error.issues.forEach(issue => {
    const field = issue.path[0]
    if (field && typeof field === 'string') {
      errors[field] = issue.message
    }
  })
  
  return errors
}

// Type exports
export type ImageUploadData = z.infer<typeof imageUploadSchema>
export type ImageEditData = z.infer<typeof imageEditSchema>
export type CategoryData = z.infer<typeof categorySchema>
export type UserData = z.infer<typeof userSchema>
export type UserEditData = z.infer<typeof userEditSchema>
export type ProfileData = z.infer<typeof profileSchema>
export type SettingsData = z.infer<typeof settingsSchema>