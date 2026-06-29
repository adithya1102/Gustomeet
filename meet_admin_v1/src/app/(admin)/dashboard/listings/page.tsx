'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import CsvExportButton from '@/components/admin/csv-export-button'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Listing = {
  id: string
  title: string
  area: string
  floor_level: number
  max_capacity: number
  created_at: string
  verification: string
  host: { full_name: string } | null
}

const statusBadge: Record<string, string> = {
  PENDING_INSPECTION: 'bg-amber-100 text-amber-700',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  UNVERIFIED: 'bg-gray-100 text-gray-600',
}

const tabs = ['All', 'Pending Inspection', 'Verified', 'Rejected']
const tabFilter: Record<string, string | null> = {
  All: null,
  'Pending Inspection': 'PENDING_INSPECTION',
  Verified: 'VERIFIED',
  Rejected: 'REJECTED',
}

const columns: ColumnDef<Listing>[] = [
  { accessorKey: 'host', header: 'Host', cell: ({ row }) => row.original.host?.full_name ?? '—' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'area', header: 'Area' },
  { accessorKey: 'floor_level', header: 'Floor' },
  { accessorKey: 'max_capacity', header: 'Capacity' },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy'),
  },
  {
    accessorKey: 'verification',
    header: 'Status',
    cell: ({ getValue }) => {
      const v = getValue() as string
      return (
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusBadge[v] ?? 'bg-gray-100 text-gray-600')}>
          {v.replace('_', ' ')}
        </span>
      )
    },
  },
]

export default function ListingsPage() {
  const router = useRouter()
  const [data, setData] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const filter = tabFilter[activeTab]
      const url = filter ? `/api/admin/listings?status=${filter}` : '/api/admin/listings'
      const res = await fetch(url)
      const json = await res.json()
      setData(json.data ?? [])
      setLoading(false)
    }
    load()
  }, [activeTab])

  const filtered = search
    ? data.filter(
        (d) =>
          d.title?.toLowerCase().includes(search.toLowerCase()) ||
          d.area?.toLowerCase().includes(search.toLowerCase())
      )
    : data

  const csvColumns = [
    { key: 'title', header: 'Title' },
    { key: 'area', header: 'Area' },
    { key: 'host', header: 'Host' },
    { key: 'verification', header: 'Verification' },
    { key: 'created_at', header: 'Created' },
  ]

  const csvData = data.map((l) => ({
    title: l.title,
    area: l.area,
    host: l.host?.full_name ?? '—',
    verification: l.verification,
    created_at: formatIST(l.created_at, 'dd MMM yyyy'),
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage terrace listing approvals</p>
        </div>
        <CsvExportButton data={csvData} columns={csvColumns} filename="listings.csv" />
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition',
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={[
            ...columns,
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => (
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/listings/${row.original.id}`) }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  Review
                </button>
              ),
            },
          ]}
          data={filtered}
          isLoading={loading}
          onRowClick={(row) => router.push(`/dashboard/listings/${row.id}`)}
          searchPlaceholder="Search title or area…"
          globalFilter={search}
          onGlobalFilterChange={setSearch}
        />
      </div>
    </div>
  )
}
