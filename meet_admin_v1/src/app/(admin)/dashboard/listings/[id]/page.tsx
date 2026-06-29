import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatIST } from '@/lib/utils'
import ListingReviewPanel from '@/components/admin/listing-review-panel'

interface Row {
  label: string
  value: string | number | null | undefined
}

function InfoRow({ label, value }: Row) {
  return (
    <div className="flex py-3 border-b border-gray-50 last:border-0">
      <span className="w-40 text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value ?? '—'}</span>
    </div>
  )
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: listing, error } = await supabase
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

  if (error || !listing) notFound()

  const host = listing.host as Record<string, unknown> | null

  return (
    <div className="p-8">
      <Link href="/dashboard/listings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={14} /> Back to Listings
      </Link>

      <div className="flex gap-8 items-start">
        {/* Left panel */}
        <div className="flex-1 space-y-6 overflow-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Terrace Info</h2>
            <InfoRow label="Title" value={listing.title} />
            <InfoRow label="Area" value={listing.area} />
            <InfoRow label="Floor" value={listing.floor_level} />
            <InfoRow label="Capacity" value={listing.max_capacity} />
            <InfoRow label="Description" value={listing.description} />
            <InfoRow label="Created" value={formatIST(listing.created_at)} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Host Details</h2>
            <InfoRow label="Name" value={host?.full_name as string} />
            <InfoRow label="Phone" value={host?.phone_number as string} />
            <InfoRow label="Email" value={host?.google_email as string} />
          </div>

          {listing.permissions && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Permissions</h2>
              {Object.entries(listing.permissions as Record<string, unknown>).map(([k, v]) => (
                <InfoRow key={k} label={k} value={String(v)} />
              ))}
            </div>
          )}

          {listing.rates && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Rates</h2>
              {Object.entries(listing.rates as Record<string, unknown>).map(([k, v]) => (
                <InfoRow key={k} label={k} value={String(v)} />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-80 flex-shrink-0">
          <ListingReviewPanel
            listingId={id}
            initialVerification={listing.verification}
            initialNote={listing.admin_review_note}
          />
        </div>
      </div>
    </div>
  )
}
