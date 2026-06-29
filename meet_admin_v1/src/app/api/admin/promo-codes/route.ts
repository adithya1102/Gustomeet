import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*, created_by_admin:created_by(full_name, employee_id)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { code, discount_type, discount_value, max_uses, valid_from, valid_until } = body
  const adminId = req.headers.get('x-admin-id') || null
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code,
      discount_type,
      discount_value,
      max_uses: max_uses || null,
      valid_from,
      valid_until: valid_until || null,
      created_by: adminId,
      used_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, is_active } = body
  const supabase = createServerClient()

  const { error } = await supabase.from('promo_codes').update({ is_active }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
