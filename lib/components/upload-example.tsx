'use client'

import React, { useState } from 'react'
import { FileUpload } from './file-upload'

/**
 * Example component demonstrating how to use the FileUpload component
 */
export function UploadExample() {
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; filename: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleUpload = (files: { url: string; filename: string }[]) => {
    setUploadedFiles(prev => [...prev, ...files])
    setError(null)
    console.log('Files uploaded:', files)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    console.error('Upload error:', errorMessage)
  }

  const clearUploads = () => {
    setUploadedFiles([])
    setError(null)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">File Upload Example</h2>
        <p className="text-gray-600 mb-6">
          This example demonstrates the file upload system with image validation, 
          optimization, and preview functionality.
        </p>
      </div>

      {/* Single File Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Single File Upload</h3>
        <FileUpload
          onUpload={handleUpload}
          onError={handleError}
          folder="examples"
          accept="image/*"
          maxSize={5 * 1024 * 1024} // 5MB
          showPreview={true}
        />
      </div>

      {/* Multiple File Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Multiple File Upload</h3>
        <FileUpload
          onUpload={handleUpload}
          onError={handleError}
          multiple={true}
          folder="examples/multiple"
          accept="image/*"
          maxSize={5 * 1024 * 1024} // 5MB
          showPreview={true}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 font-medium">Upload Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <button
              onClick={clearUploads}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-100">
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Full Size
                    </a>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Usage Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Drag and drop images or click to select files</li>
          <li>• Supported formats: JPEG, PNG, WebP, GIF</li>
          <li>• Maximum file size: 5MB per file</li>
          <li>• Images are automatically optimized and resized</li>
          <li>• Multiple files can be uploaded simultaneously</li>
        </ul>
      </div>
    </div>
  )
}