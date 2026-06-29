import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  // Total wallet balance across all users
  const { data: totalBalance } = await supabase
    .from('users')
    .select('wallet_balance')
    .not('wallet_balance', 'is', null)

  const totalWalletBalance = (totalBalance ?? []).reduce((sum, u) => sum + (u.wallet_balance || 0), 0)

  // Total transactions by type
  const { data: txByType } = await supabase
    .from('wallet_transactions')
    .select('transaction_type, amount')

  const txStats: Record<string, { count: number; total: number }> = {}
  ;(txByType ?? []).forEach((tx) => {
    const t = tx.transaction_type || 'UNKNOWN'
    if (!txStats[t]) txStats[t] = { count: 0, total: 0 }
    txStats[t].count++
    txStats[t].total += Math.abs(tx.amount || 0)
  })

  // Today's transactions
  const today = new Date().toISOString().split('T')[0]
  const { data: todayTx } = await supabase
    .from('wallet_transactions')
    .select('amount')
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${today}T23:59:59Z`)

  const todayVolume = (todayTx ?? []).reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
  const todayCount = todayTx?.length || 0

  // Top users by wallet balance
  const { data: topUsers } = await supabase
    .from('users')
    .select('id, full_name, phone_number, wallet_balance, role')
    .order('wallet_balance', { ascending: false })
    .limit(10)

  // Platform fee total collected
  const { data: platformFees } = await supabase
    .from('wallet_transactions')
    .select('platform_fee')
    .eq('transaction_type', 'DEBIT')

  const totalPlatformFees = (platformFees ?? []).reduce((sum, t) => sum + (t.platform_fee || 0), 0)

  return NextResponse.json({
    stats: {
      totalWalletBalance,
      todayVolume,
      todayCount,
      totalPlatformFees,
      transactionTypes: txStats,
    },
    topUsers: topUsers ?? [],
  })
}
