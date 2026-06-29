import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('host_payouts')
    .select('*, host:host_id(full_name), booking:booking_id(id), processed_by_admin:processed_by(full_name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id, razorpayPayoutId } = body
  const adminId = req.headers.get('x-admin-id') || 'system'
  const supabase = createServerClient()

  const { error } = await supabase
    .from('host_payouts')
    .update({
      status: 'PROCESSED',
      razorpay_payout_id: razorpayPayoutId,
      processed_at: new Date().toISOString(),
      processed_by: adminId,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
