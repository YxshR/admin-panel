import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Standard API error codes
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

// Structured API error response
export interface ApiErrorResponse {
  success: false
  error: string
  code: ApiErrorCode
  details?: any
  timestamp: string
  path?: string
}

// Structured API success response
export interface ApiSuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  timestamp: string
}

// Custom API error class
export class ApiError extends Error {
  constructor(
    public message: string,
    public code: ApiErrorCode,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Error handler function
export function handleApiError(error: unknown, path?: string): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error)

  const timestamp = new Date().toISOString()
  
  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp,
      path
    }, { status: error.statusCode })
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      code: ApiErrorCode.VALIDATION_ERROR,
      details: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      })),
      timestamp,
      path
    }, { status: 400 })
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json({
          success: false,
          error: 'A record with this information already exists',
          code: ApiErrorCode.CONFLICT,
          details: { field: error.meta?.target },
          timestamp,
          path
        }, { status: 409 })
      
      case 'P2025':
        return NextResponse.json({
          success: false,
          error: 'Record not found',
          code: ApiErrorCode.NOT_FOUND,
          timestamp,
          path
        }, { status: 404 })
      
      case 'P2003':
        return NextResponse.json({
          success: false,
          error: 'Foreign key constraint failed',
          code: ApiErrorCode.BAD_REQUEST,
          details: { field: error.meta?.field_name },
          timestamp,
          path
        }, { status: 400 })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Database operation failed',
          code: ApiErrorCode.DATABASE_ERROR,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          timestamp,
          path
        }, { status: 500 })
    }
  }

  // Handle Prisma client initialization errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      code: ApiErrorCode.DATABASE_ERROR,
      timestamp,
      path
    }, { status: 503 })
  }

  // Handle network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return NextResponse.json({
      success: false,
      error: 'External service unavailable',
      code: ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      timestamp,
      path
    }, { status: 503 })
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred',
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp,
      path
    }, { status: 500 })
  }

  // Fallback for unknown errors
  return NextResponse.json({
    success: false,
    error: 'An unexpected error occurred',
    code: ApiErrorCode.INTERNAL_SERVER_ERROR,
    timestamp,
    path
  }, { status: 500 })
}

// Success response helper
export function createSuccessResponse<T>(
  data?: T, 
  message?: string, 
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }, { status })
}

// Validation helper with better error handling
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(
        'Invalid request data',
        ApiErrorCode.VALIDATION_ERROR,
        400,
        error.issues
      )
    }
    throw error
  }
}

// Authentication error helpers
export function createAuthError(message: string = 'Authentication required'): ApiError {
  return new ApiError(message, ApiErrorCode.AUTHENTICATION_ERROR, 401)
}

export function createAuthorizationError(message: string = 'Insufficient permissions'): ApiError {
  return new ApiError(message, ApiErrorCode.AUTHORIZATION_ERROR, 403)
}

export function createNotFoundError(resource: string = 'Resource'): ApiError {
  return new ApiError(`${resource} not found`, ApiErrorCode.NOT_FOUND, 404)
}

export function createConflictError(message: string): ApiError {
  return new ApiError(message, ApiErrorCode.CONFLICT, 409)
}

export function createRateLimitError(message: string = 'Rate limit exceeded'): ApiError {
  return new ApiError(message, ApiErrorCode.RATE_LIMIT_EXCEEDED, 429)
}

// Async error wrapper for API routes
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Type guards for error responses
export function isApiError(response: any): response is ApiErrorResponse {
  return response && response.success === false && response.code
}

export function isApiSuccess<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.success === true
}