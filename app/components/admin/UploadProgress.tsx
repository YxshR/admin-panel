'use client'

import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface UploadProgressProps {
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  fileName?: string
  error?: string
  className?: string
}

export default function UploadProgress({
  progress,
  status,
  fileName,
  error,
  className = '',
}: UploadProgressProps) {
  if (status === 'idle') {
    return null
  }

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500'
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...'
      case 'success':
        return 'Upload complete'
      case 'error':
        return 'Upload failed'
      default:
        return ''
    }
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          {fileName && (
            <p className="text-sm font-medium text-gray-100 truncate">
              {fileName}
            </p>
          )}
          <p className="text-sm text-gray-400">
            {getStatusText()}
          </p>
          {error && status === 'error' && (
            <p className="text-sm text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>
        {status === 'uploading' && (
          <div className="text-sm text-gray-400">
            {progress}%
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {status === 'uploading' && (
        <div className="mt-3">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success/Error Bar */}
      {(status === 'success' || status === 'error') && (
        <div className="mt-3">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getStatusColor()}`}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}