import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const userId = searchParams.get('user_id')
  const limit = Number(searchParams.get('limit') || 100)

  let query = supabase
    .from('wallet_transactions')
    .select('*, user:user_id(full_name, phone_number), host:host_id(full_name, phone_number)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) {
    query = query.eq('transaction_type', type)
  }
  if (userId) {
    query = query.or(`user_id.eq.${userId},host_id.eq.${userId}`)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
