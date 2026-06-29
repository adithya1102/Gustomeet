import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_time,
      end_time,
      duration_units,
      rate_per_unit,
      total_time_cost,
      total_charged,
      purpose,
      guest_count,
      cleaning_assignment_id,
      created_at,
      guest:guest_id(id, full_name, phone_number),
      terrace:terrace_id(id, title, area),
      cleaner:cleaning_assignments(id, partner:cleaning_partners(id, full_name))
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { bookingId, partnerId } = await req.json()
  const supabase = createServerClient()
  const adminId = req.headers.get('x-admin-id') || 'system'
  const adminEmployeeId = req.headers.get('x-admin-employee-id') || 'system'

  const { data: assignment, error: assignError } = await supabase
    .from('cleaning_assignments')
    .insert({ booking_id: bookingId, partner_id: partnerId, status: 'ASSIGNED', created_at: new Date().toISOString() })
    .select()
    .single()

  if (assignError) return NextResponse.json({ error: assignError.message }, { status: 500 })

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ cleaning_assignment_id: assignment.id })
    .eq('id', bookingId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    employee_id: adminEmployeeId,
    action_type: 'assign_cleaner',
    target_type: 'booking',
    target_id: bookingId,
    action_detail: { partner_id: partnerId },
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, assignment })
}
