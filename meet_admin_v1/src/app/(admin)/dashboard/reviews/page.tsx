'use client'

import { useEffect, useState, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Review = {
  id: string
  reviewer: { full_name: string } | null
  reviewee: { full_name: string } | null
  booking_id: string
  rating: number
  comment: string | null
  review_type: string
  created_at: string
  is_public: boolean
}

const typeBadge: Record<string, string> = {
  GENERAL: 'bg-gray-100 text-gray-600',
  CREATOR: 'bg-violet-100 text-violet-700',
}

const tabs = ['All', 'General', 'Creator']
const tabFilter: Record<string, string | null> = { All: null, General: 'GENERAL', Creator: 'CREATOR' }

const columns: ColumnDef<Review>[] = [
  { accessorKey: 'reviewer', header: 'Reviewer', cell: ({ row }) => row.original.reviewer?.full_name ?? '—' },
  { accessorKey: 'reviewee', header: 'Reviewee', cell: ({ row }) => row.original.reviewee?.full_name ?? '—' },
  { accessorKey: 'booking_id', header: 'Booking', cell: ({ getValue }) => (getValue() as string)?.substring(0, 8).toUpperCase() ?? '—' },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ getValue }) => {
      const v = getValue() as number
      return (
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
          v >= 4 ? 'bg-emerald-100 text-emerald-700' : v === 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
        )}>
          {v} ★
        </span>
      )
    },
  },
  { accessorKey: 'comment', header: 'Comment', cell: ({ getValue }) => <span className="line-clamp-1 max-w-xs">{getValue() as string | null ?? '—'}</span> },
  {
    accessorKey: 'review_type',
    header: 'Type',
    cell: ({ getValue }) => {
      const v = getValue() as string
      return <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', typeBadge[v] ?? 'bg-gray-100 text-gray-600')}>{v}</span>
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy'),
  },
]

export default function ReviewsPage() {
  const [data, setData] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/reviews')
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = activeTab === 'All' ? data : data.filter((d) => d.review_type === tabFilter[activeTab])

  async function togglePublic(id: string, is_public: boolean) {
    const res = await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_public: !is_public }),
    })
    if (!res.ok) { toast.error('Failed to update'); return }
    toast.success('Updated')
    load()
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Manage user reviews and ratings</p>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition', activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={[
            ...columns,
            {
              id: 'public',
              header: 'Public',
              cell: ({ row }) => (
                <button
                  onClick={(e) => { e.stopPropagation(); togglePublic(row.original.id, row.original.is_public) }}
                  className={cn('px-2 py-0.5 rounded-full text-xs font-medium transition',
                    row.original.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {row.original.is_public ? 'Yes' : 'No'}
                </button>
              ),
            },
          ]}
          data={filtered}
          isLoading={loading}
          searchPlaceholder="Search reviewer or reviewee…"
        />
      </div>
    </div>
  )
}
