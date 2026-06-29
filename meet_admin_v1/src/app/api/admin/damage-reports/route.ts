import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('damage_reports')
    .select('*, host:host_id(full_name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status, resolved_amount } = body
  const supabase = createServerClient()

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (resolved_amount !== undefined) updates.resolved_amount = resolved_amount
  if (status === 'RESOLVED') updates.resolved_at = new Date().toISOString()

  const { error } = await supabase.from('damage_reports').update(updates).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
