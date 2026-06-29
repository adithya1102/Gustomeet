'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type ConfigRow = {
  key: string
  value: string
  description: string | null
  updated_at: string
  updater: { full_name: string } | null
}

const columns: ColumnDef<ConfigRow>[] = [
  { accessorKey: 'key', header: 'Key' },
  { accessorKey: 'description', header: 'Description', cell: ({ getValue }) => (getValue() as string | null) ?? '—' },
  {
    accessorKey: 'updated_at',
    header: 'Updated',
    cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy, hh:mm a'),
  },
  { accessorKey: 'updater', header: 'By', cell: ({ row }) => row.original.updater?.full_name ?? '—' },
]

export default function PlatformConfigPage() {
  const [data, setData] = useState<ConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    fetch('/api/admin/platform-config')
      .then((r) => r.json())
      .then((d) => { setData(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave(key: string) {
    const res = await fetch('/api/admin/platform-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: editValue }),
    })
    if (!res.ok) { toast.error('Failed to save'); return }
    toast.success('Saved')
    setEditingKey(null)
    setData((prev) => prev.map((r) => r.key === key ? { ...r, value: editValue, updated_at: new Date().toISOString() } : r))
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Config</h1>
        <p className="text-sm text-gray-500 mt-1">Manage system-wide configuration values</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={[
            ...columns,
            {
              accessorKey: 'value',
              header: 'Value',
              cell: ({ row }) => {
                const isEditing = editingKey === row.original.key
                if (isEditing) {
                  return (
                    <div className="flex items-center gap-2">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={2}
                        className="w-64 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button onClick={() => handleSave(row.original.key)} className="px-2 py-1 bg-emerald-500 text-white text-xs rounded">Save</button>
                      <button onClick={() => setEditingKey(null)} className="px-2 py-1 text-gray-500 text-xs">Cancel</button>
                    </div>
                  )
                }
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-700 line-clamp-1 max-w-xs">{row.original.value}</span>
                    <button
                      onClick={() => { setEditingKey(row.original.key); setEditValue(row.original.value) }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                )
              },
            },
          ]}
          data={data}
          isLoading={loading}
          searchPlaceholder="Search config keys…"
        />
      </div>
    </div>
  )
}
