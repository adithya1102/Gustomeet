import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('terraces')
    .select(`
      *,
      host:host_id(*),
      permissions:terrace_permissions(*),
      light_data:terrace_light_data(*),
      rates:terrace_rates(*)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { action, note, reason } = body
  const supabase = createServerClient()

  const adminId = req.headers.get('x-admin-id') || 'system'
  const adminEmployeeId = req.headers.get('x-admin-employee-id') || 'system'

  let verification: string
  let adminNote: string | null = null
  let isActive: boolean | undefined

  if (action === 'approve') {
    verification = 'VERIFIED'
    isActive = true
  } else if (action === 'reject') {
    verification = 'REJECTED'
    adminNote = reason || null
    isActive = false
  } else if (action === 'request_info') {
    verification = 'PENDING_INSPECTION'
    adminNote = note || null
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    verification,
    admin_review_note: adminNote,
    updated_at: new Date().toISOString(),
  }
  if (isActive !== undefined) updates.is_active = isActive

  const { error } = await supabase
    .from('terraces')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    employee_id: adminEmployeeId,
    action_type: `listing_${action}`,
    target_type: 'terrace',
    target_id: id,
    action_detail: { note: adminNote, verification },
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
