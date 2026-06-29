'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  listingId: string
  initialVerification: string
  initialNote: string | null
}

const statusBadge: Record<string, string> = {
  PENDING_INSPECTION: 'bg-amber-100 text-amber-700',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  UNVERIFIED: 'bg-gray-100 text-gray-600',
}

export default function ListingReviewPanel({ listingId, initialVerification, initialNote }: Props) {
  const router = useRouter()
  const [verification, setVerification] = useState(initialVerification)
  const [note, setNote] = useState(initialNote ?? '')
  const [requestText, setRequestText] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [showRequest, setShowRequest] = useState(false)

  async function doAction(action: string, extra?: Record<string, string>) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Updated successfully')
      if (action === 'approve') setVerification('VERIFIED')
      if (action === 'request_info') setVerification('PENDING_INSPECTION')
      if (action === 'reject') setVerification('REJECTED')
      router.refresh()
    } finally {
      setLoading(false)
      setShowReject(false)
      setShowRequest(false)
    }
  }

  return (
    <div className="sticky top-8 bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</p>
        <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusBadge[verification] ?? 'bg-gray-100 text-gray-600')}>
          {verification.replace('_', ' ')}
        </span>
      </div>

      {note && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Admin Note</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{note}</p>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <button
          onClick={() => doAction('approve')}
          disabled={loading || verification === 'VERIFIED'}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          Approve
        </button>

        <button
          onClick={() => setShowRequest(!showRequest)}
          disabled={loading}
          className="w-full py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm font-medium rounded-lg transition"
        >
          Request Info
        </button>

        {showRequest && (
          <div className="space-y-2">
            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="What information do you need?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={() => doAction('request_info', { note: requestText })}
              disabled={!requestText.trim() || loading}
              className="w-full py-2 bg-violet-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              Send Request
            </button>
          </div>
        )}

        <button
          onClick={() => setShowReject(!showReject)}
          disabled={loading || verification === 'REJECTED'}
          className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          Reject
        </button>

        {showReject && (
          <div className="space-y-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={() => doAction('reject', { reason: rejectReason })}
              disabled={!rejectReason.trim() || loading}
              className="w-full py-2 bg-red-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              Confirm Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
