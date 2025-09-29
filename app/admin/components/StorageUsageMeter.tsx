interface StorageUsageMeterProps {
  used: number
  total: number
  percentage: number
  warning: boolean
}

export default function StorageUsageMeter({ 
  used, 
  total, 
  percentage, 
  warning 
}: StorageUsageMeterProps) {
  const getColorClass = () => {
    if (warning) return 'bg-red-500'
    if (percentage > 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getTextColor = () => {
    if (warning) return 'text-red-400'
    if (percentage > 60) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Storage Usage</h3>
        {warning && (
          <div className="flex items-center space-x-1 text-red-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Warning</span>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Used</span>
          <span className={getTextColor()}>{used} MB of {total} MB</span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getColorClass()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm">
          <span className={getTextColor()}>{percentage.toFixed(1)}% used</span>
          <span className="text-gray-400">{(total - used).toFixed(1)} MB free</span>
        </div>
        
        {warning && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">
              Storage usage is above 80%. Consider cleaning up old files or upgrading your storage plan.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}