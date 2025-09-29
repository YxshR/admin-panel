'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import CategoryForm from '../components/CategoryForm'
import CategoryDeleteModal from '../components/CategoryDeleteModal'
import Toast from '../components/Toast'

interface Category {
  id: string
  name: string
  description: string | null
  imageCount: number
  createdAt: string
  updatedAt: string
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export default function CategoriesPage() {
  const { data: session, status } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [formLoading, setFormLoading] = useState(false)

  const addToast = (message: string, type: Toast['type']) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.data.categories)
      } else {
        addToast('Failed to fetch categories', 'error')
      }
    } catch (error) {
      addToast('Error fetching categories', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400">Loading...</div>
    </div>
  }

  if (!session) {
    redirect('/admin/login')
  }

  const handleCreateCategory = async (formData: { name: string; description?: string }) => {
    setFormLoading(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCategories(prev => [...prev, data.data])
        setShowForm(false)
        addToast('Category created successfully', 'success')
      } else {
        addToast(data.error || 'Failed to create category', 'error')
      }
    } catch (error) {
      addToast('Error creating category', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateCategory = async (formData: { name: string; description?: string }) => {
    if (!editingCategory) return
    
    setFormLoading(true)
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id ? data.data : cat
        ))
        setEditingCategory(null)
        addToast('Category updated successfully', 'success')
      } else {
        addToast(data.error || 'Failed to update category', 'error')
      }
    } catch (error) {
      addToast('Error updating category', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteCategory = async (reassignToCategoryId?: string) => {
    if (!deletingCategory) return
    
    setFormLoading(true)
    try {
      const response = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reassignToCategoryId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCategories(prev => prev.filter(cat => cat.id !== deletingCategory.id))
        setDeletingCategory(null)
        addToast(data.message || 'Category deleted successfully', 'success')
      } else {
        addToast(data.error || 'Failed to delete category', 'error')
      }
    } catch (error) {
      addToast('Error deleting category', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Categories</h1>
          <p className="text-gray-400 mt-2">Organize your images with categories</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center text-gray-400">Loading categories...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Categories</h1>
          <p className="text-gray-400 mt-2">Organize your images with categories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-gray-800 rounded-lg p-4">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categories Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Images
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    {searchTerm ? 'No categories found matching your search.' : 'No categories yet. Create your first category!'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-100">{category.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 max-w-xs truncate">
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                        {category.imageCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingCategory(category)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {(showForm || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="max-w-md w-full mx-4">
            <CategoryForm
              category={editingCategory || undefined}
              onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
              onCancel={() => {
                setShowForm(false)
                setEditingCategory(null)
              }}
              isLoading={formLoading}
            />
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingCategory && (
        <CategoryDeleteModal
          category={deletingCategory}
          categories={categories}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
          isLoading={formLoading}
        />
      )}

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}