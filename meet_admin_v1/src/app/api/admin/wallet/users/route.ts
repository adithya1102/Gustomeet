import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.toLowerCase()
  const minBalance = searchParams.get('min_balance')
  const role = searchParams.get('role')

  let query = supabase
    .from('users')
    .select('id, full_name, phone_number, role, wallet_balance, completed_bookings, kyc_verified, created_at')
    .order('wallet_balance', { ascending: false })

  if (minBalance) {
    query = query.gte('wallet_balance', Number(minBalance))
  }
  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let filtered = data ?? []
  if (search) {
    filtered = filtered.filter(
      (u) =>
        (u.full_name?.toLowerCase().includes(search) ?? false) ||
        (u.phone_number?.toLowerCase().includes(search) ?? false)
    )
  }

  return NextResponse.json({ data: filtered })
}
