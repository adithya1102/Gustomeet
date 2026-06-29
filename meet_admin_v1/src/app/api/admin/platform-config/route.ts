import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('platform_config')
    .select('*, updater:updated_by(full_name)')
    .order('key', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { key, value } = body
  const adminId = req.headers.get('x-admin-id') || null
  const supabase = createServerClient()

  const { error } = await supabase
    .from('platform_config')
    .update({ value, updated_by: adminId, updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
