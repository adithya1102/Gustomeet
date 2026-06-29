'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import { formatIST } from '@/lib/utils'

type AuditLog = {
  id: string
  admin: { full_name: string; employee_id: string } | null
  action_type: string
  target_type: string | null
  target_id: string | null
  action_detail: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'admin',
    header: 'Admin',
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.admin?.full_name ?? '—'}</p>
        <p className="text-xs text-gray-500">{row.original.admin?.employee_id ?? ''}</p>
      </div>
    ),
  },
  { accessorKey: 'action_type', header: 'Action' },
  { accessorKey: 'target_type', header: 'Target Type', cell: ({ getValue }) => (getValue() as string | null) ?? '—' },
  { accessorKey: 'target_id', header: 'Target ID', cell: ({ getValue }) => (getValue() as string | null)?.substring(0, 8).toUpperCase() ?? '—' },
  {
    accessorKey: 'action_detail',
    header: 'Details',
    cell: ({ getValue }) => {
      const detail = getValue() as Record<string, unknown>
      const text = JSON.stringify(detail)
      return <code className="text-xs text-gray-600 font-mono">{text.length > 100 ? text.slice(0, 100) + '…' : text}</code>
    },
  },
  { accessorKey: 'ip_address', header: 'IP', cell: ({ getValue }) => (getValue() as string | null) ?? '—' },
  {
    accessorKey: 'created_at',
    header: 'Timestamp',
    cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy, hh:mm a'),
  },
]

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/audit-log')
      .then((r) => r.json())
      .then((d) => { setData(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">Track all admin actions and changes</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={columns}
          data={data}
          isLoading={loading}
          searchPlaceholder="Search action or admin…"
        />
      </div>
    </div>
  )
}
