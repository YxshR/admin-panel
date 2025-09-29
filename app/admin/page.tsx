'use client'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { useSession } from 'next-auth/react'
import StatsCard from './components/StatsCard'
import StorageUsageMeter from './components/StorageUsageMeter'
import RecentActivityFeed from './components/RecentActivityFeed'
import { 
  Images, 
  FolderOpen, 
  Users, 
  HardDrive,
  Upload,
  Settings,
  Activity,
  UserPlus
} from 'lucide-react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const { stats, isLoading, error, refetch } = useDashboard()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session) {
    redirect('/admin/login')
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-gray-400 mt-2">Welcome back, {session.user.email}</p>
        </div>
        
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-semibold text-red-400">Error Loading Dashboard</h3>
          </div>
          <p className="text-red-300 mt-2">{error}</p>
          <button 
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-2">Welcome back, {session.user.email}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="text-sm text-slate-300">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Images</p>
              <p className="text-2xl font-bold text-white mt-1">{isLoading ? '...' : stats?.totalImages || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Images className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Categories</p>
              <p className="text-2xl font-bold text-white mt-1">{isLoading ? '...' : stats?.totalCategories || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Users</p>
              <p className="text-2xl font-bold text-white mt-1">{isLoading ? '...' : stats?.totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Storage Used</p>
              <p className="text-2xl font-bold text-white mt-1">{isLoading ? '...' : `${stats?.storageUsed || 0} MB`}</p>
              <p className="text-xs text-slate-500 mt-1">{isLoading ? '' : `${stats?.storagePercentage || 0}% of ${stats?.storageLimit || 0} MB`}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats?.storageWarning ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
              <HardDrive className={`w-6 h-6 ${stats?.storageWarning ? 'text-red-400' : 'text-orange-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Storage Usage */}
        {!isLoading && stats && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Storage Usage</h3>
            <StorageUsageMeter
              used={stats.storageUsed}
              total={stats.storageLimit}
              percentage={stats.storagePercentage}
              warning={stats.storageWarning}
            />
          </div>
        )}
        
        {/* Recent Activity */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <RecentActivityFeed
            activities={stats?.recentActivity || []}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a 
            href="/admin/images" 
            className="group flex items-center space-x-4 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700/70 transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <Upload className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-300 group-hover:text-white font-medium">Upload Images</span>
          </a>
          
          <a 
            href="/admin/categories" 
            className="group flex items-center space-x-4 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700/70 transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
          >
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <FolderOpen className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-300 group-hover:text-white font-medium">Categories</span>
          </a>
          
          <a 
            href="/admin/activity" 
            className="group flex items-center space-x-4 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700/70 transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
          >
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-slate-300 group-hover:text-white font-medium">Activity Log</span>
          </a>
          
          <a 
            href="/admin/users" 
            className="group flex items-center space-x-4 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700/70 transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
          >
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
              <UserPlus className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-slate-300 group-hover:text-white font-medium">Manage Users</span>
          </a>
        </div>
      </div>
    </div>
  )
}