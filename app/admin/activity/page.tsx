import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ActivityLogClient from './ActivityLogClient'

export default async function ActivityPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/admin')
  }

  return <ActivityLogClient />
}