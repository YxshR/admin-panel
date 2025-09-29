import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

interface ActivityItem {
  id: string
  title: string
  uploadedBy: string
  category: string
  createdAt: string
  thumbnailUrl: string
}

interface RecentActivityFeedProps {
  activities: ActivityItem[]
  isLoading?: boolean
}

export default function RecentActivityFeed({ activities, isLoading }: RecentActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-700 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Recent Activity</h3>
        <a 
          href="/admin/activity" 
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          View all
        </a>
      </div>
      
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-700/50 rounded-lg transition-colors">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                <Image
                  src={activity.thumbnailUrl}
                  alt={activity.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-100 truncate">
                    {activity.title}
                  </p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
                    {activity.category}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-gray-400">
                    Uploaded by {activity.uploadedBy}
                  </p>
                  <span className="text-gray-600">•</span>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}