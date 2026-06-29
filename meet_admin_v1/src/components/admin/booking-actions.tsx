'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import AssignCleanerModal from '@/components/admin/assign-cleaner-modal'

interface BookingActionsProps {
  bookingId: string
  guestCheckedIn: boolean
  guestCheckedInAt: string | null
  checkoutPhotosSubmitted: boolean
  postCleanVerified: boolean
  hasCleaningAssignment: boolean
}

export default function BookingActions({
  bookingId,
  guestCheckedIn,
  guestCheckedInAt,
  checkoutPhotosSubmitted,
  postCleanVerified,
  hasCleaningAssignment,
}: BookingActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAssign, setShowAssign] = useState(false)

  async function handleCheckIn() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_in' }),
      })
      if (!res.ok) { toast.error('Failed to check in'); return }
      toast.success('Guest checked in')
      router.refresh()
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCheckout() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_checkout' }),
      })
      if (!res.ok) { toast.error('Failed to verify'); return }
      toast.success('Checkout verified')
      router.refresh()
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {!guestCheckedIn && (
        <button
          onClick={handleCheckIn}
          disabled={loading}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          Check In Guest
        </button>
      )}
      {guestCheckedIn && (
        <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
          Checked in at {guestCheckedInAt ? new Date(guestCheckedInAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      )}

      {checkoutPhotosSubmitted && !postCleanVerified && (
        <button
          onClick={handleVerifyCheckout}
          disabled={loading}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          Verify Checkout
        </button>
      )}
      {postCleanVerified && (
        <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
          Checkout verified
        </div>
      )}

      {!hasCleaningAssignment && (
        <button
          onClick={() => setShowAssign(true)}
          className="w-full py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm font-medium rounded-lg transition"
        >
          Assign Cleaner
        </button>
      )}

      {showAssign && (
        <AssignCleanerModal
          bookingId={bookingId}
          open={showAssign}
          onClose={() => setShowAssign(false)}
          onAssigned={() => router.refresh()}
        />
      )}
    </div>
  )
}
