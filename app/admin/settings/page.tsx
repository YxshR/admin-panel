'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Settings, 
  Cloud, 
  Database, 
  Shield, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  TestTube
} from 'lucide-react'
import Toast from '../components/Toast'

interface SystemSettings {
  cloudinary: {
    cloudName: string
    apiKey: string
    apiSecret: string
    uploadPreset: string
    configured: boolean
  }
  database: {
    connected: boolean
    url: string
    configured: boolean
  }
  auth: {
    secret: string
    configured: boolean
  }
}

interface CloudinaryValidationResult {
  success: boolean
  message?: string
  error?: string
  data?: {
    cloudName: string
    status: string
  }
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [validationResult, setValidationResult] = useState<CloudinaryValidationResult | null>(null)

  // Form states for Cloudinary settings
  const [cloudName, setCloudName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [uploadPreset, setUploadPreset] = useState('')

  // Toast state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
        setCloudName(data.data.cloudinary.cloudName)
        setApiKey(data.data.cloudinary.apiKey)
        setApiSecret('')
        setUploadPreset(data.data.cloudinary.uploadPreset)
      } else {
        setToast({ message: data.error || 'Failed to fetch settings', type: 'error' })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setToast({ message: 'Failed to fetch settings', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleValidateCloudinary = async () => {
    if (!cloudName || !apiKey || !apiSecret) {
      setToast({ message: 'Please fill in all Cloudinary fields before validating', type: 'error' })
      return
    }

    setValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch('/api/admin/settings/validate-cloudinary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cloudName,
          apiKey,
          apiSecret,
          uploadPreset,
        }),
      })

      const data = await response.json()
      setValidationResult(data)

      if (data.success) {
        setToast({ message: 'Cloudinary configuration is valid!', type: 'success' })
      } else {
        setToast({ message: data.error || 'Cloudinary validation failed', type: 'error' })
      }
    } catch (error) {
      console.error('Error validating Cloudinary:', error)
      const errorResult: CloudinaryValidationResult = {
        success: false,
        error: 'Failed to validate Cloudinary configuration'
      }
      setValidationResult(errorResult)
      setToast({ message: 'Failed to validate Cloudinary configuration', type: 'error' })
    } finally {
      setValidating(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!hasUnsavedChanges()) {
      setToast({ message: 'No changes to save', type: 'error' })
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cloudinary: {
            cloudName,
            apiKey,
            apiSecret: apiSecret || undefined,
            uploadPreset,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: 'Settings saved successfully!', type: 'success' })
        // Refresh settings to get updated values
        await fetchSettings()
      } else {
        setToast({ message: data.error || 'Failed to save settings', type: 'error' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setToast({ message: 'Failed to save settings', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const hasUnsavedChanges = () => {
    if (!settings) return false
    
    return (
      cloudName !== settings.cloudinary.cloudName ||
      apiKey !== settings.cloudinary.apiKey ||
      (apiSecret !== '' && apiSecret !== settings.cloudinary.apiSecret) ||
      uploadPreset !== settings.cloudinary.uploadPreset
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
          <p className="text-gray-400 mt-2">Configure system settings</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
          <p className="text-gray-400 mt-2">Configure system settings</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300">Failed to load system settings.</p>
        </div>
      </div>
    )
  }

  // Check if user is admin
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
          <p className="text-gray-400 mt-2">Configure system settings</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            <p>Only administrators can access system settings.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400 mt-2">Configure system settings and integrations</p>
      </div>

      {/* System Status Overview */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Cloud className="h-5 w-5 text-blue-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-400">Cloudinary</p>
                  <p className="text-lg font-semibold text-gray-100">Storage</p>
                </div>
              </div>
              <div className="flex items-center">
                {settings.cloudinary.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="h-5 w-5 text-green-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-400">Database</p>
                  <p className="text-lg font-semibold text-gray-100">PostgreSQL</p>
                </div>
              </div>
              <div className="flex items-center">
                {settings.database.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-purple-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-400">Authentication</p>
                  <p className="text-lg font-semibold text-gray-100">NextAuth</p>
                </div>
              </div>
              <div className="flex items-center">
                {settings.auth.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloudinary Configuration */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            Cloudinary Configuration
          </h2>
          {hasUnsavedChanges() && (
            <div className="flex items-center text-yellow-400 text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Unsaved changes
            </div>
          )}
        </div>

        {/* Warning Message */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium">Important</p>
              <p className="text-yellow-300 text-sm mt-1">
                Changing Cloudinary settings will affect image uploads and storage. 
                Make sure to validate the configuration before saving.
              </p>
            </div>
          </div>
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cloudName" className="block text-sm font-medium text-gray-300 mb-2">
                Cloud Name
              </label>
              <input
                type="text"
                id="cloudName"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                className="w-full px-4 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-0"
                placeholder="Enter Cloudinary cloud name"
                required
              />
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="text"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-0"
                placeholder="Enter Cloudinary API key"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-300 mb-2">
              API Secret
            </label>
            <div className="relative">
              <input
                type={showApiSecret ? 'text' : 'password'}
                id="apiSecret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full px-4 py-3 sm:py-2 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-0"
                placeholder={settings.cloudinary.apiSecret ? 'Enter new API secret (leave blank to keep current)' : 'Enter Cloudinary API secret'}
              />
              <button
                type="button"
                onClick={() => setShowApiSecret(!showApiSecret)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              >
                {showApiSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="uploadPreset" className="block text-sm font-medium text-gray-300 mb-2">
              Upload Preset (Optional)
            </label>
            <input
              type="text"
              id="uploadPreset"
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-0"
              placeholder="Enter upload preset name"
            />
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`rounded-lg p-4 ${
              validationResult.success 
                ? 'bg-green-900/20 border border-green-700' 
                : 'bg-red-900/20 border border-red-700'
            }`}>
              <div className="flex items-start">
                {validationResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    validationResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {validationResult.success ? 'Configuration Valid' : 'Configuration Invalid'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    validationResult.success ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {validationResult.message || validationResult.error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4">
            <button
              type="button"
              onClick={handleValidateCloudinary}
              disabled={validating || !cloudName || !apiKey || !apiSecret}
              className="inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {validating ? 'Validating...' : 'Test Configuration'}
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving || !hasUnsavedChanges()}
              className="inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Additional System Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">System Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="text-gray-400">Database Connection</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              settings.database.connected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {settings.database.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="text-gray-400">Authentication Service</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              settings.auth.configured 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {settings.auth.configured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400">Image Storage</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              settings.cloudinary.configured 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {settings.cloudinary.configured ? 'Cloudinary Connected' : 'Not Configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}