import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

function getStartOfDay(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function getStartOfMonth(monthsAgo: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function GET() {
  const supabase = createServerClient()

  const now = new Date().toISOString()
  const thirtyDaysAgo = getStartOfDay(30)
  const twelveMonthsAgo = getStartOfMonth(12)

  const { data: allBookings } = await supabase
    .from('bookings')
    .select('created_at, total_charged, purpose, status')
    .gte('created_at', thirtyDaysAgo)
    .lte('created_at', now)

  const dailyBookings = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const dateStr = d.toISOString().split('T')[0]
    const count = (allBookings ?? []).filter((b) => b.created_at.startsWith(dateStr)).length
    return { date: dateStr, count }
  })

  const revenueByPurpose: Record<string, number> = {}
  ;(allBookings ?? []).forEach((b) => {
    const p = b.purpose || 'OTHER'
    revenueByPurpose[p] = (revenueByPurpose[p] || 0) + (b.total_charged || 0)
  })

  const { data: topTerracesRaw } = await supabase
    .from('bookings')
    .select('terrace_id, terraces(title)')
    .gte('created_at', thirtyDaysAgo)

  const terraceMap: Record<string, { title: string; bookings: number }> = {}
  ;(topTerracesRaw ?? []).forEach((b) => {
    const t = b.terrace_id as string
    const title = (b.terraces as { title?: string } | null)?.title ?? 'Unknown'
    if (!terraceMap[t]) terraceMap[t] = { title, bookings: 0 }
    terraceMap[t].bookings++
  })
  const topTerraces = Object.values(terraceMap)
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 10)

  const { data: userGrowth } = await supabase
    .from('users')
    .select('created_at')
    .gte('created_at', twelveMonthsAgo)

  const monthMap: Record<string, number> = {}
  Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (11 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = 0
  })
  ;(userGrowth ?? []).forEach((u) => {
    const key = u.created_at.substring(0, 7)
    if (monthMap[key] !== undefined) monthMap[key]++
  })
  const userGrowthData = Object.entries(monthMap).map(([month, count]) => ({ month, count }))

  const statusDistribution: Record<string, number> = {}
  ;(allBookings ?? []).forEach((b) => {
    statusDistribution[b.status] = (statusDistribution[b.status] || 0) + 1
  })
  const statusDistributionData = Object.entries(statusDistribution).map(([status, count]) => ({ status, count }))

  const totalRevenue = (allBookings ?? []).reduce((sum, b) => sum + (b.total_charged || 0), 0)
  const totalBookings = (allBookings ?? []).length

  const { count: userCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })

  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

  return NextResponse.json({
    dailyBookings,
    revenueByPurpose: Object.entries(revenueByPurpose).map(([purpose, revenue]) => ({ purpose, revenue })),
    topTerraces,
    userGrowth: userGrowthData,
    statusDistribution: statusDistributionData,
    stats: {
      totalRevenue,
      totalBookings,
      activeUsers: userCount ?? 0,
      avgBookingValue: Math.round(avgBookingValue),
    },
  })
}
