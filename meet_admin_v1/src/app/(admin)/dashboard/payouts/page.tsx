'use client'

import { useEffect, useState, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Payout = {
  id: string
  host: { full_name: string } | null
  booking: { id: string } | null
  gross_amount: number
  platform_fee: number
  net_amount: number
  status: string
  razorpay_payout_id: string | null
  processed_at: string | null
  processed_by_admin: { full_name: string } | null
  created_at: string
}

const statusBadge: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
}

const tabs = ['All', 'Pending', 'Processed', 'Failed']
const tabFilter: Record<string, string | null> = { All: null, Pending: 'PENDING', Processed: 'PROCESSED', Failed: 'FAILED' }

const columns: ColumnDef<Payout>[] = [
  { accessorKey: 'host', header: 'Host', cell: ({ row }) => row.original.host?.full_name ?? '—' },
  { accessorKey: 'booking', header: 'Booking', cell: ({ row }) => row.original.booking?.id?.substring(0, 8).toUpperCase() ?? '—' },
  { accessorKey: 'gross_amount', header: 'Gross', cell: ({ getValue }) => `₹${(getValue() as number)?.toLocaleString('en-IN') ?? 0}` },
  { accessorKey: 'platform_fee', header: 'Fee', cell: ({ getValue }) => `₹${(getValue() as number)?.toLocaleString('en-IN') ?? 0}` },
  { accessorKey: 'net_amount', header: 'Net', cell: ({ getValue }) => `₹${(getValue() as number)?.toLocaleString('en-IN') ?? 0}` },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const v = getValue() as string
      return <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusBadge[v] ?? 'bg-gray-100 text-gray-600')}>{v}</span>
    },
  },
  {
    accessorKey: 'processed_at',
    header: 'Processed',
    cell: ({ getValue }) => (getValue() ? formatIST(getValue() as string, 'dd MMM yyyy') : '—'),
  },
]

export default function PayoutsPage() {
  const [data, setData] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [processId, setProcessId] = useState<string | null>(null)
  const [razorpayId, setRazorpayId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/payouts')
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = activeTab === 'All' ? data : data.filter((d) => d.status === tabFilter[activeTab])

  async function handleProcess() {
    if (!processId || !razorpayId.trim()) return
    const res = await fetch('/api/admin/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: processId, razorpayPayoutId: razorpayId.trim() }),
    })
    if (!res.ok) { toast.error('Failed to process'); return }
    toast.success('Payout processed')
    setProcessId(null)
    setRazorpayId('')
    load()
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="text-sm text-gray-500 mt-1">Manage host payouts and commissions</p>
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
              id: 'actions',
              header: '',
              cell: ({ row }) =>
                row.original.status === 'PENDING' ? (
                  <button onClick={() => setProcessId(row.original.id)} className="px-3 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium transition">
                    Process
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                ),
            },
          ]}
          data={filtered}
          isLoading={loading}
          searchPlaceholder="Search host or booking…"
        />
      </div>

      {processId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
            <h3 className="font-semibold text-gray-900 mb-4">Process Payout</h3>
            <input
              type="text"
              placeholder="Razorpay Payout ID"
              value={razorpayId}
              onChange={(e) => setRazorpayId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setProcessId(null)} className="flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition">Cancel</button>
              <button onClick={handleProcess} disabled={!razorpayId.trim()} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
