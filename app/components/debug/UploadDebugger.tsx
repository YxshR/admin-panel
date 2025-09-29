'use client'

import { useState } from 'react'

export default function UploadDebugger() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testHealthCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setResult({ type: 'health', data })
    } catch (error) {
      setResult({ type: 'health', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testImageUpload = async () => {
    setLoading(true)
    try {
      // Create a simple test image (1x1 pixel PNG)
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ff0000'
        ctx.fillRect(0, 0, 1, 1)
      }

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setResult({ type: 'upload', error: 'Failed to create test image' })
          setLoading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', blob, 'test.png')
        formData.append('title', 'Debug Test Image')
        formData.append('description', 'Test image for debugging')
        formData.append('categoryId', 'test-category-id') // You'll need to replace with actual category ID
        formData.append('tags', JSON.stringify(['debug', 'test']))

        try {
          const response = await fetch('/api/admin/images', {
            method: 'POST',
            body: formData
          })
          const data = await response.json()
          setResult({ type: 'upload', data, status: response.status })
        } catch (error) {
          setResult({ type: 'upload', error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
          setLoading(false)
        }
      }, 'image/png')
    } catch (error) {
      setResult({ type: 'upload', error: error instanceof Error ? error.message : 'Unknown error' })
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-white">Upload Debugger</h3>
      
      <div className="space-x-4">
        <button
          onClick={testHealthCheck}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Health Check
        </button>
        
        <button
          onClick={testImageUpload}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Image Upload
        </button>
      </div>

      {loading && (
        <div className="text-yellow-400">Testing...</div>
      )}

      {result && (
        <div className="bg-gray-900 p-4 rounded">
          <h4 className="text-white font-medium mb-2">
            {result.type === 'health' ? 'Health Check Result' : 'Upload Test Result'}
          </h4>
          <pre className="text-sm text-gray-300 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}