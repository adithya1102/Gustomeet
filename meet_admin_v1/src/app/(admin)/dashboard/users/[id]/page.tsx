import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { formatIST } from '@/lib/utils'

interface InfoRowProps {
  label: string
  value: React.ReactNode
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex py-3 border-b border-gray-50 last:border-0">
      <span className="w-40 text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value ?? '—'}</span>
    </div>
  )
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('*, kyc_links:user_kyc_links(kyc_record:kyc_records(*))')
    .eq('id', id)
    .single()

  if (error || !user) notFound()

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

  const kycRecord = (user.kyc_links as Array<{ kyc_record: Record<string, unknown> }> | null)?.[0]?.kyc_record

  return (
    <div className="p-8">
      <Link href="/dashboard/users" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={14} /> Back to Users
      </Link>

      <div className="flex gap-8 items-start">
        <div className="flex-1 space-y-6 overflow-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
            <InfoRow label="Name" value={user.full_name} />
            <InfoRow label="Phone" value={user.phone_number} />
            <InfoRow label="Email" value={user.google_email} />
            <InfoRow label="Role" value={user.role} />
            <InfoRow label="Creator Type" value={user.creator_type} />
            <InfoRow label="Bio" value={user.bio} />
            <InfoRow label="Wallet Balance" value={`₹${(user.wallet_balance as number)?.toLocaleString('en-IN') ?? 0}`} />
            <InfoRow label="Completed Bookings" value={user.completed_bookings} />
            <InfoRow label="Joined" value={formatIST(user.created_at, 'dd MMM yyyy, hh:mm a')} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">KYC Verification</h2>
            <InfoRow
              label="Status"
              value={
                user.kyc_verified ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Verified</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Not Verified</span>
                )
              }
            />
            {kycRecord && (
              <>
                <InfoRow label="Verified Name" value={kycRecord.verified_name as string} />
                <InfoRow label="Phone at Verification" value={kycRecord.phone_at_verification as string} />
                <InfoRow label="Verified DOB" value={kycRecord.verified_dob as string} />
                <InfoRow label="Verified Gender" value={kycRecord.verified_gender as string} />
              </>
            )}
          </div>

          {terraces && terraces.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Terraces ({terraces.length})</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Title</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Area</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {terraces.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50">
                      <td className="px-4 py-2">{t.title}</td>
                      <td className="px-4 py-2 text-gray-600">{t.area}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{t.verification}</span>
                      </td>
                      <td className="px-4 py-2">
                        {t.is_active ? (
                          <span className="text-xs text-emerald-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-xs text-gray-400">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="w-96 flex-shrink-0 space-y-6">
          {guestBookings && guestBookings.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Guest Bookings ({guestBookings.length})</h2>
              <div className="space-y-3">
                {guestBookings.map((b) => (
                  <div key={b.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-gray-900">
                        {(b.terrace as { title?: string } | null)?.title ?? 'Unknown Terrace'}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{b.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatIST(b.start_time, 'dd MMM yyyy, hh:mm a')} — {formatIST(b.end_time, 'hh:mm a')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">₹{(b.total_charged as number)?.toLocaleString('en-IN') ?? 0}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews && reviews.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Reviews ({reviews.length})</h2>
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-gray-900">
                        {(r.reviewer as { full_name?: string } | null)?.full_name ?? 'Anonymous'}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.rating >= 4 ? 'bg-emerald-100 text-emerald-700' : r.rating === 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.rating} ★
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{r.review_type}</p>
                    {r.comment && <p className="text-xs text-gray-600 mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
