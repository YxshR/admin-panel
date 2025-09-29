'use client'

import { useState, useEffect } from 'react'
import { Search, Download, Filter, AlertTriangle, Calendar, User, Activity } from 'lucide-react'

interface ActivityLog {
  id: string
  action: string
  details: any
  createdAt: string
  user: {
    id: string
    email: string
    role: string
  }
  image?: {
    id: string
    title: string
    thumbnailUrl: string
  }
  isSuspicious: boolean
  isFlagged: boolean
}

interface ActivityStats {
  total: number
  today: number
  week: number
  month: number
  suspicious: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ActivityLogClient() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showSuspicious, setShowSuspicious] = useState(false)

  const fetchActivities = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })

      if (search) params.append('search', search)
      if (actionFilter) params.append('action', actionFilter)
      if (userFilter) params.append('userId', userFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (showSuspicious) params.append('flagged', 'true')

      const response = await fetch(`/api/admin/activity?${params}`)
      if (!response.ok) throw new Error('Failed to fetch activities')

      const data = await response.json()
      setActivities(data.activity)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/activity/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const exportLogs = async () => {
    try {
      setExporting(true)
      const params = new URLSearchParams({ export: 'csv' })

      if (search) params.append('search', search)
      if (actionFilter) params.append('action', actionFilter)
      if (userFilter) params.append('userId', userFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (showSuspicious) params.append('flagged', 'true')

      const response = await fetch(`/api/admin/activity?${params}`)
      if (!response.ok) throw new Error('Failed to export logs')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting logs:', error)
    } finally {
      setExporting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setActionFilter('')
    setUserFilter('')
    setStartDate('')
    setEndDate('')
    setShowSuspicious(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getActionColor = (action: string) => {
    if (action.includes('SUSPICIOUS_ACTIVITY')) return 'text-red-400'
    if (action.includes('DELETE')) return 'text-red-300'
    if (action.includes('CREATE')) return 'text-green-300'
    if (action.includes('UPDATE')) return 'text-yellow-300'
    if (action.includes('LOGIN')) return 'text-blue-300'
    return 'text-gray-300'
  }

  const getActionIcon = (action: string) => {
    if (action.includes('SUSPICIOUS_ACTIVITY')) return <AlertTriangle className="w-4 h-4" />
    if (action.includes('LOGIN')) return <User className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  useEffect(() => {
    fetchActivities()
    fetchStats()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchActivities(1)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, actionFilter, userFilter, startDate, endDate, showSuspicious])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Activity Logs</h1>
          <p className="text-gray-400 mt-2">Monitor system activity and audit trail</p>
        </div>
        <button
          onClick={exportLogs}
          disabled={exporting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Activities</p>
                <p className="text-2xl font-bold text-gray-100">{stats.total.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Today</p>
                <p className="text-2xl font-bold text-gray-100">{stats.today}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Week</p>
                <p className="text-2xl font-bold text-gray-100">{stats.week}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-gray-100">{stats.month}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Suspicious</p>
                <p className="text-2xl font-bold text-red-400">{stats.suspicious}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-100">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search actions, users, images..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="IMAGE">Image Actions</option>
              <option value="CATEGORY">Category Actions</option>
              <option value="USER">User Actions</option>
              <option value="SUSPICIOUS">Suspicious Activity</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSuspicious}
              onChange={(e) => setShowSuspicious(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600 text-red-500 focus:ring-red-500"
            />
            <span className="text-gray-300">Show only suspicious activities</span>
          </label>

          <button
            onClick={clearFilters}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Loading activities...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No activities found
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className={activity.isSuspicious ? 'bg-red-900/20' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={getActionColor(activity.action)}>
                          {getActionIcon(activity.action)}
                        </span>
                        <span className={`text-sm font-medium ${getActionColor(activity.action)}`}>
                          {activity.action.replace(/_/g, ' ')}
                        </span>
                        {activity.isSuspicious && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-200">
                            Flagged
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-100">
                          {activity.user.email}
                        </div>
                        <div className="text-sm text-gray-400">
                          {activity.user.role}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activity.image ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={activity.image.thumbnailUrl}
                            alt={activity.image.title}
                            className="w-8 h-8 rounded object-cover"
                          />
                          <span className="text-sm text-gray-300 truncate max-w-32">
                            {activity.image.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {activity.details && (
                        <div className="text-sm text-gray-400 max-w-xs">
                          <pre className="whitespace-pre-wrap text-xs">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(activity.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-700 px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchActivities(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 text-gray-300 rounded text-sm"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-gray-300 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => fetchActivities(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 text-gray-300 rounded text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}