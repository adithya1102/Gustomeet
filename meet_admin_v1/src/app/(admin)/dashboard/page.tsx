import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import StatsCard from '@/components/admin/stats-card'
import { Building2, CalendarDays, Clock, Zap, IndianRupee } from 'lucide-react'
import { formatIST } from '@/lib/utils'

async function fetchStats() {
  const supabase = createServerClient()

  const [walletRes, activeRes, bookingsRes, pendingRes, activeNowRes, pendingListingsRes] = await Promise.all([
    supabase.from('users').select('wallet_balance').not('wallet_balance', 'is', null),
    supabase.from('terraces').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('terraces').select('id', { count: 'exact', head: true }).eq('verification', 'PENDING_INSPECTION'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase
      .from('terraces')
      .select('id, title, area, floor_level, created_at, host:host_id(full_name)')
      .eq('verification', 'PENDING_INSPECTION')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalWalletBalance = (walletRes.data ?? []).reduce((sum, u) => sum + (u.wallet_balance || 0), 0)

  return {
    totalWalletBalance,
    totalActive: activeRes.count ?? 0,
    bookingsMonth: bookingsRes.count ?? 0,
    pendingReview: pendingRes.count ?? 0,
    activeNow: activeNowRes.count ?? 0,
    pendingListings: pendingListingsRes.data ?? [],
  }
}

export default async function DashboardPage() {
  const stats = await fetchStats()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of Gusto Meets activity</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatsCard label="Active Terraces" value={stats.totalActive} icon={Building2} color="emerald" />
        <StatsCard label="Bookings This Month" value={stats.bookingsMonth} icon={CalendarDays} color="violet" />
        <StatsCard label="Pending Review" value={stats.pendingReview} icon={Clock} color="amber" />
        <StatsCard label="Active Now" value={stats.activeNow} icon={Zap} color="blue" />
        <StatsCard label="Total Wallet" value={`₹${stats.totalWalletBalance.toLocaleString('en-IN')}`} icon={IndianRupee} color="emerald" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Pending Listings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Host Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Area</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Floor</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Submitted</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {stats.pendingListings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No pending listings
                  </td>
                </tr>
              )}
              {stats.pendingListings.map((listing: Record<string, unknown>) => (
                <tr key={listing.id as string} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {(listing.host as Record<string, unknown> | null)?.full_name as string ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{listing.area as string}</td>
                  <td className="px-6 py-4 text-gray-600">{listing.floor_level as number}</td>
                  <td className="px-6 py-4 text-gray-500">{formatIST(listing.created_at as string, 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/listings/${listing.id}`}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
