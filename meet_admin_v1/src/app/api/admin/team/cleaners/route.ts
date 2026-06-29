import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('cleaning_partners')
    .select('id, full_name, phone_number, is_active, total_cleans_completed, avg_rating, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phone, email } = body
  const supabase = createServerClient()
  const adminId = req.headers.get('x-admin-id') || 'system'
  const adminEmployeeId = req.headers.get('x-admin-employee-id') || 'system'

  const { data, error } = await supabase
    .from('cleaning_partners')
    .insert({ full_name: name, phone_number: phone, email, is_active: true, created_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    employee_id: adminEmployeeId,
    action_type: 'create_cleaner',
    target_type: 'cleaning_partner',
    target_id: data.id,
    action_detail: { name, phone },
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, data })
}
