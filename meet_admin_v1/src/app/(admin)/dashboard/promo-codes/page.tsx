'use client'

import { useEffect, useState, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

type PromoCode = {
  id: string
  code: string
  discount_type: string
  discount_value: number
  used_count: number
  max_uses: number | null
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_by_admin: { full_name: string } | null
  created_at: string
}

const schema = z.object({
  code: z.string().min(1),
  discount_type: z.enum(['FLAT', 'PERCENT']),
  discount_value: z.number().positive(),
  max_uses: z.number().optional().nullable(),
  valid_from: z.string(),
  valid_until: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

const typeBadge: Record<string, string> = {
  FLAT: 'bg-blue-100 text-blue-700',
  PERCENT: 'bg-violet-100 text-violet-700',
}

const columns: ColumnDef<PromoCode>[] = [
  { accessorKey: 'code', header: 'Code' },
  {
    accessorKey: 'discount_type',
    header: 'Type',
    cell: ({ getValue }) => {
      const v = getValue() as string
      return <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', typeBadge[v] ?? 'bg-gray-100 text-gray-600')}>{v}</span>
    },
  },
  {
    accessorKey: 'discount_value',
    header: 'Value',
    cell: ({ getValue, row }) => {
      const v = getValue() as number
      return row.original.discount_type === 'PERCENT' ? `${v}%` : `₹${v.toLocaleString('en-IN')}`
    },
  },
  { accessorKey: 'used_count', header: 'Used' },
  { accessorKey: 'max_uses', header: 'Max Uses', cell: ({ getValue }) => (getValue() as number | null) ?? '∞' },
  {
    accessorKey: 'valid_from',
    header: 'Valid From',
    cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy'),
  },
  {
    accessorKey: 'valid_until',
    header: 'Valid Until',
    cell: ({ getValue }) => (getValue() ? formatIST(getValue() as string, 'dd MMM yyyy') : '—'),
  },
  {
    accessorKey: 'is_active',
    header: 'Active',
    cell: ({ getValue }) =>
      getValue() ? (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
      ) : (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
      ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy'),
  },
]

export default function PromoCodesPage() {
  const [data, setData] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { discount_type: 'FLAT', discount_value: 0, valid_from: new Date().toISOString().split('T')[0] } })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/promo-codes')
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function onSubmit(values: FormData) {
    const res = await fetch('/api/admin/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) { toast.error('Failed to create'); return }
    toast.success('Promo code created')
    form.reset()
    setShowModal(false)
    load()
  }

  async function toggleActive(id: string, is_active: boolean) {
    const res = await fetch('/api/admin/promo-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    if (!res.ok) { toast.error('Failed to update'); return }
    toast.success('Updated')
    load()
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage discount codes and promotions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition">
          <Plus size={16} /> New Code
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={[
            ...columns,
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => (
                <button onClick={(e) => { e.stopPropagation(); toggleActive(row.original.id, row.original.is_active) }} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  {row.original.is_active ? 'Deactivate' : 'Activate'}
                </button>
              ),
            },
          ]}
          data={data}
          isLoading={loading}
          searchPlaceholder="Search promo codes…"
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">New Promo Code</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <input {...form.register('code')} placeholder="Code (e.g. SUMMER25)" className={inputClass} />
              <select {...form.register('discount_type')} className={inputClass}>
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENT">Percentage (%)</option>
              </select>
              <input {...form.register('discount_value', { valueAsNumber: true })} type="number" placeholder="Discount Value" className={inputClass} />
              <input {...form.register('max_uses', { valueAsNumber: true })} type="number" placeholder="Max Uses (optional)" className={inputClass} />
              <input {...form.register('valid_from')} type="date" className={inputClass} />
              <input {...form.register('valid_until')} type="date" placeholder="Valid Until (optional)" className={inputClass} />
              <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition">Create</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
