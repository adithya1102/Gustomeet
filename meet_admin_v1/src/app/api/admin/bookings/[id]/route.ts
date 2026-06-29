import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      guest:guest_id(id, full_name, phone_number, google_email, kyc_verified),
      terrace:terrace_id(id, title, area, max_capacity, host:host_id(full_name)),
      cleaning:cleaning_assignments(id, status, expected_arrival_time, actual_arrival_time, completion_time, partner:partner_id(full_name))
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { action } = body
  const supabase = createServerClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (action === 'check_in') {
    updates.guest_checked_in = true
    updates.guest_checked_in_at = new Date().toISOString()
  } else if (action === 'verify_checkout') {
    updates.post_clean_verified = true
  } else if (action === 'update_status') {
    const allowed = ['PENDING_PAYMENT', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED']
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = body.status
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { error } = await supabase.from('bookings').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
