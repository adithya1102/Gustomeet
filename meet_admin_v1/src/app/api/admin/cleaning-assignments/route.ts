import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('cleaning_assignments')
    .select('*, partner:partner_id(full_name), booking:booking_id(id, status, terrace:terrace_id(title))')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { booking_id, partner_id, expected_arrival_time } = body
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('cleaning_assignments')
    .insert({
      booking_id,
      partner_id,
      expected_arrival_time: expected_arrival_time || new Date().toISOString(),
      status: 'ASSIGNED',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('bookings').update({ cleaning_assignment_id: data.id }).eq('id', booking_id)

  return NextResponse.json({ success: true, data })
}
