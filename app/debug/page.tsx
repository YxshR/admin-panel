'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [healthCheck, setHealthCheck] = useState<any>(null)
  const [dashboardStats, setDashboardStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthCheck(data))
      .catch(err => setHealthCheck({ error: err.message }))

    if (session) {
      fetch('/api/dashboard/stats')
        .then(res => res.json())
        .then(data => setDashboardStats(data))
        .catch(err => setDashboardStats({ error: err.message }))
    }
  }, [session])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Debug Information</h1>
      
      <div className="space-y-8">
        {/* Authentication Status */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Session:</strong> {session ? 'Authenticated' : 'Not authenticated'}</p>
            {session && (
              <div className="mt-4">
                <p><strong>User ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Role:</strong> {session.user.role}</p>
                <p><strong>Status:</strong> {session.user.status}</p>
              </div>
            )}
          </div>
        </div>

        {/* Health Check */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Health Check</h2>
          <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(healthCheck, null, 2)}
          </pre>
        </div>

        {/* Dashboard Stats */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Dashboard Stats</h2>
          <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(dashboardStats, null, 2)}
          </pre>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <a 
              href="/admin/login" 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded inline-block"
            >
              Go to Login
            </a>
            <a 
              href="/admin" 
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded inline-block"
            >
              Go to Admin
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}