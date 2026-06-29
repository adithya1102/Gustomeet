'use client'

import { useEffect, useState, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type DamageReport = {
  id: string
  host: { full_name: string } | null
  description: string
  claimed_amount: number | null
  resolved_amount: number | null
  status: string
  photos: string[]
  created_at: string
  resolved_at: string | null
}

const statusBadge: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const tabs = ['All', 'Pending', 'Resolved', 'Rejected']
const tabFilter: Record<string, string | null> = { All: null, Pending: 'PENDING', Resolved: 'RESOLVED', Rejected: 'REJECTED' }

const columns: ColumnDef<DamageReport>[] = [
  { accessorKey: 'host', header: 'Host', cell: ({ row }) => row.original.host?.full_name ?? '—' },
  { accessorKey: 'description', header: 'Description', cell: ({ getValue }) => <span className="line-clamp-1 max-w-xs">{getValue() as string}</span> },
  {
    accessorKey: 'claimed_amount',
    header: 'Claimed',
    cell: ({ getValue }) => (getValue() ? `₹${(getValue() as number)?.toLocaleString('en-IN')}` : '—'),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const v = getValue() as string
      return <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusBadge[v] ?? 'bg-gray-100 text-gray-600')}>{v}</span>
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Reported',
    cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy'),
  },
]

export default function DamageReportsPage() {
  const [data, setData] = useState<DamageReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [resolvedAmount, setResolvedAmount] = useState('')
  const [detailStatus, setDetailStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/damage-reports')
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = activeTab === 'All' ? data : data.filter((d) => d.status === tabFilter[activeTab])

  const detail = data.find((d) => d.id === detailId)

  async function handleUpdate() {
    if (!detailId) return
    const res = await fetch('/api/admin/damage-reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: detailId,
        status: detailStatus || detail?.status,
        resolved_amount: resolvedAmount ? Number(resolvedAmount) : undefined,
      }),
    })
    if (!res.ok) { toast.error('Failed to update'); return }
    toast.success('Updated')
    setDetailId(null)
    setResolvedAmount('')
    load()
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Damage Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Manage damage claims and resolutions</p>
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
              cell: ({ row }) => (
                <button onClick={() => { setDetailId(row.original.id); setDetailStatus(row.original.status); setResolvedAmount(row.original.resolved_amount?.toString() ?? '') }} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  View
                </button>
              ),
            },
          ]}
          data={filtered}
          isLoading={loading}
          searchPlaceholder="Search host or description…"
        />
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[32rem] max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Damage Report</h3>
              <button onClick={() => setDetailId(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <div className="space-y-4 text-sm">
              <p><span className="text-gray-500">Host:</span> <span className="font-medium">{detail.host?.full_name ?? '—'}</span></p>
              <p><span className="text-gray-500">Description:</span> {detail.description}</p>
              <p><span className="text-gray-500">Claimed:</span> {detail.claimed_amount ? `₹${detail.claimed_amount.toLocaleString('en-IN')}` : '—'}</p>
              <p><span className="text-gray-500">Reported:</span> {formatIST(detail.created_at)}</p>

              {detail.photos && detail.photos.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-2">Photos:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {detail.photos.map((url, i) => (
                      <img key={i} src={url} alt="damage" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select value={detailStatus} onChange={(e) => setDetailStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3">
                  <option value="PENDING">PENDING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>

                <label className="block text-xs font-medium text-gray-500 mb-1">Resolved Amount (₹)</label>
                <input type="number" value={resolvedAmount} onChange={(e) => setResolvedAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4" />

                <div className="flex gap-3">
                  <button onClick={() => setDetailId(null)} className="flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition">Cancel</button>
                  <button onClick={handleUpdate} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition">Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
