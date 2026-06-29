import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('terraces')
    .select(`
      id,
      title,
      area,
      floor_level,
      max_capacity,
      verification,
      is_active,
      created_at,
      host:host_id(id, full_name, phone_number)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('verification', status)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
