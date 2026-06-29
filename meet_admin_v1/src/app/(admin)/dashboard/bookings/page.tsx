'use client'

import { useEffect, useState, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import AssignCleanerModal from '@/components/admin/assign-cleaner-modal'
import CsvExportButton from '@/components/admin/csv-export-button'
import BulkActionBar from '@/components/admin/bulk-action-bar'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'

import { exportToCSV } from '@/lib/csv-export'

type Booking = {
  id: string
  status: string
  start_time: string
  end_time: string
  duration_units: number
  rate_per_unit: number
  total_time_cost: number
  total_charged: number
  purpose: string
  guest_count: number
  cleaning_assignment_id: string | null
  created_at: string
  guest: { full_name: string; phone_number: string } | null
  terrace: { title: string; area: string } | null
  cleaner: { partner: { full_name: string } } | null
}

const statusBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
}

export default function BookingsPage() {
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [assignBookingId, setAssignBookingId] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<Booking[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/bookings')
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const csvColumns = [
    { key: 'guest', header: 'Guest' },
    { key: 'terrace', header: 'Terrace' },
    { key: 'start_time', header: 'Start Time' },
    { key: 'end_time', header: 'End Time' },
    { key: 'status', header: 'Status' },
    { key: 'total_charged', header: 'Total Charged' },
    { key: 'purpose', header: 'Purpose' },
    { key: 'guest_count', header: 'Guest Count' },
  ]

  const csvData = data.map((b) => ({
    guest: b.guest?.full_name ?? '—',
    terrace: b.terrace?.title ?? '—',
    start_time: formatIST(b.start_time, 'dd MMM yyyy, hh:mm a'),
    end_time: formatIST(b.end_time, 'hh:mm a'),
    status: b.status,
    total_charged: b.total_charged,
    purpose: b.purpose,
    guest_count: b.guest_count,
  }))

  const columns: ColumnDef<Booking>[] = [
    { accessorKey: 'guest', header: 'Guest', cell: ({ row }) => row.original.guest?.full_name ?? '—' },
    { accessorKey: 'terrace', header: 'Terrace', cell: ({ row }) => row.original.terrace?.title ?? '—' },
    {
      accessorKey: 'start_time',
      header: 'Date & Time',
      cell: ({ row }) => `${formatIST(row.original.start_time, 'dd MMM yyyy, hh:mm a')} - ${formatIST(row.original.end_time, 'hh:mm a')}`,
    },
    { accessorKey: 'duration_units', header: 'Duration', cell: ({ getValue }) => `${getValue()} units` },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const v = getValue() as string
        return (
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusBadge[v] ?? 'bg-gray-100 text-gray-600')}>
            {v}
          </span>
        )
      },
    },
    {
      accessorKey: 'total_charged',
      header: 'Total',
      cell: ({ getValue }) => `₹${(getValue() as number)?.toLocaleString('en-IN') ?? 0}`,
    },
    {
      accessorKey: 'cleaner',
      header: 'Cleaner',
      cell: ({ row }) => row.original.cleaner?.partner?.full_name ?? <span className="text-gray-400 text-xs">Unassigned</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); setAssignBookingId(row.original.id) }}
          className="px-3 py-1.5 text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg font-medium transition"
        >
          Assign Cleaner
        </button>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage bookings and cleaning assignments</p>
        </div>
        <CsvExportButton data={csvData} columns={csvColumns} filename="bookings.csv" />
      </div>

      <BulkActionBar
        selectedCount={selectedRows.length}
        onClear={() => setSelectedRows([])}
        actions={[
          {
            label: 'Export Selected',
            variant: 'secondary',
            onClick: () => {
              const selectedCsv = selectedRows.map((b) => ({
                guest: b.guest?.full_name ?? '—',
                terrace: b.terrace?.title ?? '—',
                start_time: formatIST(b.start_time, 'dd MMM yyyy, hh:mm a'),
                end_time: formatIST(b.end_time, 'hh:mm a'),
                status: b.status,
                total_charged: b.total_charged,
                purpose: b.purpose,
                guest_count: b.guest_count,
              }))
              exportToCSV(selectedCsv, csvColumns, 'selected-bookings.csv')
            },
          },
        ]}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={columns}
          data={data}
          isLoading={loading}
          searchPlaceholder="Search guest or terrace…"
          enableSelection
          onSelectionChange={setSelectedRows}
        />
      </div>

      {assignBookingId && (
        <AssignCleanerModal
          bookingId={assignBookingId}
          open={!!assignBookingId}
          onClose={() => setAssignBookingId(null)}
          onAssigned={load}
        />
      )}
    </div>
  )
}
