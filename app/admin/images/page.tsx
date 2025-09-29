import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ImageManagementClient from './ImageManagementClient'

export default async function AdminImagesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/admin/login')
  }

  // Fetch categories for the upload form
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          images: true,
        }
      }
    },
    orderBy: {
      name: 'asc',
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Image Management</h1>
          <p className="text-gray-400 mt-1">
            Upload and manage your image library
          </p>
        </div>
      </div>

      <ImageManagementClient categories={categories} />
    </div>
  )
}