import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/admin/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const adminId = headersList.get('x-admin-id')

  if (!adminId) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  )
}
