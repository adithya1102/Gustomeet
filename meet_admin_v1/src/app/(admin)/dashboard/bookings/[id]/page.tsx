import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'
import BookingActions from '@/components/admin/booking-actions'

interface InfoRowProps {
  label: string
  value: React.ReactNode
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex py-3 border-b border-gray-50 last:border-0">
      <span className="w-44 text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value ?? '—'}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    COMPLETED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-700',
    DISPUTED: 'bg-red-100 text-red-700',
  }
  return <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[status] ?? 'bg-gray-100 text-gray-600')}>{status.replace('_', ' ')}</span>
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      guest:guest_id(id, full_name, phone_number, google_email, kyc_verified),
      terrace:terrace_id(id, title, area, max_capacity, host:host_id(full_name)),
      cleaning:cleaning_assignments(id, status, expected_arrival_time, actual_arrival_time, completion_time, partner:partner_id(full_name))
    `)
    .eq('id', id)
    .single()

  if (error || !booking) notFound()

  const guest = booking.guest as { full_name?: string; phone_number?: string; google_email?: string; kyc_verified?: boolean } | null
  const terrace = booking.terrace as { title?: string; area?: string; max_capacity?: number; host?: { full_name?: string } } | null
  const cleaning = booking.cleaning as { id?: string; status?: string; expected_arrival_time?: string; actual_arrival_time?: string; completion_time?: string; partner?: { full_name?: string } } | null

  return (
    <div className="p-8">
      <Link href="/dashboard/bookings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={14} /> Back to Bookings
      </Link>

      <div className="flex gap-8 items-start">
        <div className="flex-1 space-y-6 overflow-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Booking Info</h2>
              <StatusBadge status={booking.status} />
            </div>
            <InfoRow label="Booking ID" value={booking.id.substring(0, 8).toUpperCase()} />
            <InfoRow label="Purpose" value={booking.purpose} />
            <InfoRow label="Purpose Description" value={booking.purpose_description} />
            <InfoRow label="Guest Count" value={booking.guest_count} />
            <InfoRow label="Start" value={formatIST(booking.start_time, 'dd MMM yyyy, hh:mm a')} />
            <InfoRow label="End" value={formatIST(booking.end_time, 'dd MMM yyyy, hh:mm a')} />
            <InfoRow label="Duration" value={`${booking.duration_units} ${booking.duration_type}`} />
            <InfoRow label="Rate per Unit" value={`₹${booking.rate_per_unit.toLocaleString('en-IN')}`} />
            <InfoRow label="Time Cost" value={`₹${booking.total_time_cost.toLocaleString('en-IN')}`} />
            <InfoRow label="Security Deposit" value={`₹${booking.security_deposit.toLocaleString('en-IN')}`} />
            <InfoRow label="Platform Fee" value={`₹${booking.platform_fee.toLocaleString('en-IN')}`} />
            <InfoRow label="Utility Fee" value={`₹${booking.utility_fee.toLocaleString('en-IN')}`} />
            <InfoRow label="Cleaning Fee" value={`₹${booking.cleaning_fee.toLocaleString('en-IN')}`} />
            <InfoRow label="Discount" value={booking.discount_amount ? `₹${booking.discount_amount.toLocaleString('en-IN')}` : '—'} />
            <InfoRow label="Overstay Penalty" value={booking.overstay_penalty ? `₹${booking.overstay_penalty.toLocaleString('en-IN')}` : '—'} />
            <InfoRow label="Damage Penalty" value={booking.damage_penalty ? `₹${booking.damage_penalty.toLocaleString('en-IN')}` : '—'} />
            <InfoRow label="Total Charged" value={`₹${booking.total_charged.toLocaleString('en-IN')}`} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Guest</h2>
            <InfoRow label="Name" value={guest?.full_name} />
            <InfoRow label="Phone" value={guest?.phone_number} />
            <InfoRow label="Email" value={guest?.google_email} />
            <InfoRow
              label="KYC"
              value={guest?.kyc_verified ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Verified</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Not Verified</span>
              )}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Terrace</h2>
            <InfoRow label="Title" value={terrace?.title} />
            <InfoRow label="Area" value={terrace?.area} />
            <InfoRow label="Max Capacity" value={terrace?.max_capacity} />
            <InfoRow label="Host" value={terrace?.host?.full_name} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Payment</h2>
            <InfoRow label="Razorpay Order ID" value={booking.razorpay_order_id} />
            <InfoRow label="Razorpay Payment ID" value={booking.razorpay_payment_id} />
          </div>

          {cleaning && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Cleaning Assignment</h2>
              <InfoRow label="Partner" value={cleaning.partner?.full_name} />
              <InfoRow label="Status" value={cleaning.status} />
              <InfoRow label="Expected Arrival" value={cleaning.expected_arrival_time ? formatIST(cleaning.expected_arrival_time) : '—'} />
              <InfoRow label="Actual Arrival" value={cleaning.actual_arrival_time ? formatIST(cleaning.actual_arrival_time) : '—'} />
              <InfoRow label="Completion" value={cleaning.completion_time ? formatIST(cleaning.completion_time) : '—'} />
            </div>
          )}
        </div>

        <div className="w-80 flex-shrink-0 space-y-6">
          <div className="sticky top-8 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
              <BookingActions
                bookingId={id}
                guestCheckedIn={booking.guest_checked_in}
                guestCheckedInAt={booking.guest_checked_in_at}
                checkoutPhotosSubmitted={booking.checkout_photos_submitted}
                postCleanVerified={booking.post_clean_verified}
                hasCleaningAssignment={!!cleaning}
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Booking Created</p>
                    <p className="text-xs text-gray-500">{formatIST(booking.created_at, 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                </div>
                {booking.guest_checked_in && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Guest Checked In</p>
                      <p className="text-xs text-gray-500">{formatIST(booking.guest_checked_in_at, 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                  </div>
                )}
                {booking.checkout_photos_submitted && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Checkout Photos Submitted</p>
                    </div>
                  </div>
                )}
                {booking.post_clean_verified && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Post-Clean Verified</p>
                    </div>
                  </div>
                )}
                {booking.status === 'COMPLETED' && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Booking Completed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
