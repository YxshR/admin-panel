'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Role, Status } from '@prisma/client'
import { User, ApiResponse } from '@/types'
import UserForm from '../components/UserForm'
import UserDeleteModal from '../components/UserDeleteModal'
import Toast from '../components/Toast'

interface UserWithCounts extends User {
  _count: {
    uploadedImages: number
    activityLogs: number
  }
}

interface UsersResponse {
  users: UserWithCounts[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithCounts | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserWithCounts | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [statusFilter, setStatusFilter] = useState<Status | ''>('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // Check if current user is admin
  const isAdmin = session?.user?.role === 'ADMIN'

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter) params.append('role', roleFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      const data: ApiResponse<UsersResponse> = await response.json()

      if (data.success && data.data) {
        setUsers(data.data.users)
        setPagination(data.data.pagination)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [currentPage, searchTerm, roleFilter, statusFilter, isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateUser = async (userData: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data: ApiResponse = await response.json()

      if (data.success) {
        setToast({ message: 'User created successfully', type: 'success' })
        setShowCreateForm(false)
        fetchUsers()
      } else {
        setToast({ message: data.error || 'Failed to create user', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Failed to create user', type: 'error' })
      console.error('Error creating user:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateUser = async (userData: any) => {
    if (!editingUser) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data: ApiResponse = await response.json()

      if (data.success) {
        setToast({ message: 'User updated successfully', type: 'success' })
        setEditingUser(null)
        fetchUsers()
      } else {
        setToast({ message: data.error || 'Failed to update user', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Failed to update user', type: 'error' })
      console.error('Error updating user:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      })

      const data: ApiResponse = await response.json()

      if (data.success) {
        setToast({ message: 'User deleted successfully', type: 'success' })
        setDeletingUser(null)
        fetchUsers()
      } else {
        setToast({ message: data.error || 'Failed to delete user', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Failed to delete user', type: 'error' })
      console.error('Error deleting user:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const getRoleBadgeColor = (role: Role) => {
    return role === Role.ADMIN ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'
  }

  const getStatusBadgeColor = (status: Status) => {
    return status === Status.ACTIVE ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Users</h1>
          <p className="text-gray-400 mt-2">Manage user accounts and permissions</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You need administrator privileges to manage users.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Create New User</h1>
          <p className="text-gray-400 mt-2">Add a new user to the system</p>
        </div>
        
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateForm(false)}
          isLoading={formLoading}
        />
      </div>
    )
  }

  if (editingUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Edit User</h1>
          <p className="text-gray-400 mt-2">Update user information and permissions</p>
        </div>
        
        <UserForm
          user={editingUser}
          onSubmit={handleUpdateUser}
          onCancel={() => setEditingUser(null)}
          isLoading={formLoading}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Users</h1>
          <p className="text-gray-400 mt-2">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-md flex items-center justify-center touch-manipulation min-h-[44px] sm:min-h-0"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-0">
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">
              Search by email
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
              placeholder="Enter email address..."
            />
          </div>
          
          <div className="w-full sm:w-auto min-w-[120px]">
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-300 mb-1">
              Role
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | '')}
              className="w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
            >
              <option value="">All Roles</option>
              <option value={Role.ADMIN}>Admin</option>
              <option value={Role.EDITOR}>Editor</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto min-w-[120px]">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | '')}
              className="w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
            >
              <option value="">All Status</option>
              <option value={Status.ACTIVE}>Active</option>
              <option value={Status.DISABLED}>Disabled</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
          >
            Search
          </button>
          
          {(searchTerm || roleFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('')
                setStatusFilter('')
                setCurrentPage(1)
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-400">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">Error Loading Users</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">No Users Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || roleFilter || statusFilter 
                ? 'No users match your current filters.'
                : 'Get started by creating your first user.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-300">
                                {user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-100">{user.email}</div>
                            <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div>{user._count.uploadedImages} images</div>
                        <div className="text-gray-500">{user._count.activityLogs} actions</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Edit user"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {user.id !== session?.user?.id && (
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="text-red-400 hover:text-red-300"
                              title="Delete user"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-600">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deletingUser && (
        <UserDeleteModal
          user={deletingUser}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeletingUser(null)}
          isLoading={formLoading}
        />
      )}

      {/* Toast */}
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