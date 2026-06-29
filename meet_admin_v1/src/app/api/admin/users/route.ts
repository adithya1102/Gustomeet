import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const kyc = searchParams.get('kyc')
  const search = searchParams.get('search')?.toLowerCase()

  let query = supabase
    .from('users')
    .select('id, full_name, phone_number, role, has_host_profile, kyc_verified, wallet_balance, completed_bookings, created_at, google_email, bio, creator_type')
    .order('created_at', { ascending: false })

  if (role) {
    query = query.eq('role', role)
  }
  if (kyc === 'true') {
    query = query.eq('kyc_verified', true)
  } else if (kyc === 'false') {
    query = query.eq('kyc_verified', false)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let filtered = data ?? []
  if (search) {
    filtered = filtered.filter(
      (u) =>
        (u.full_name?.toLowerCase().includes(search) ?? false) ||
        (u.phone_number?.toLowerCase().includes(search) ?? false) ||
        (u.google_email?.toLowerCase().includes(search) ?? false)
    )
  }

  return NextResponse.json({ data: filtered })
}
