import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*, kyc_links:user_kyc_links(kyc_record:kyc_records(*))')
    .eq('id', id)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: userError?.message || 'User not found' }, { status: 404 })
  }

  const { data: terraces } = await supabase
    .from('terraces')
    .select('id, title, area, verification, is_active, created_at')
    .eq('host_id', id)
    .order('created_at', { ascending: false })

  const { data: guestBookings } = await supabase
    .from('bookings')
    .select('id, status, start_time, end_time, total_charged, terrace:terrace_id(title, area)')
    .eq('guest_id', id)
    .order('created_at', { ascending: false })

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, review_type, created_at, reviewer:reviewer_id(full_name)')
    .eq('reviewee_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    data: {
      user,
      terraces: terraces ?? [],
      guestBookings: guestBookings ?? [],
      reviews: reviews ?? [],
    },
  })
}
