'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import CsvExportButton from '@/components/admin/csv-export-button'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'

type User = {
  id: string
  full_name: string | null
  phone_number: string | null
  role: string
  has_host_profile: boolean
  kyc_verified: boolean
  wallet_balance: number
  completed_bookings: number
  created_at: string
  google_email: string | null
  bio: string | null
  creator_type: string | null
}

const roles = ['All', 'GUEST', 'HOST', 'CREATOR']
const kycFilters = ['All', 'Verified', 'Unverified']

const roleBadge: Record<string, string> = {
  GUEST: 'bg-gray-100 text-gray-600',
  HOST: 'bg-violet-100 text-violet-700',
  CREATOR: 'bg-amber-100 text-amber-700',
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'full_name',
    header: 'Name',
    cell: ({ row }) => row.original.full_name ?? '—',
  },
  { accessorKey: 'phone_number', header: 'Phone' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => {
      const v = getValue() as string
      return (
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', roleBadge[v] ?? 'bg-gray-100 text-gray-600')}>
          {v}
        </span>
      )
    },
  },
  {
    accessorKey: 'kyc_verified',
    header: 'KYC',
    cell: ({ getValue }) =>
      getValue() ? (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Verified</span>
      ) : (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Pending</span>
      ),
  },
  {
    accessorKey: 'wallet_balance',
    header: 'Wallet',
    cell: ({ getValue }) => `₹${(getValue() as number)?.toLocaleString('en-IN') ?? 0}`,
  },
  { accessorKey: 'completed_bookings', header: 'Bookings' },
  {
    accessorKey: 'created_at',
    header: 'Joined',
    cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy'),
  },
]

export default function UsersPage() {
  const router = useRouter()
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleTab, setRoleTab] = useState('All')
  const [kycTab, setKycTab] = useState('All')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (roleTab !== 'All') params.set('role', roleTab)
    if (kycTab === 'Verified') params.set('kyc', 'true')
    if (kycTab === 'Unverified') params.set('kyc', 'false')
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/users?${params.toString()}`)
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [roleTab, kycTab, search])

  useEffect(() => { load() }, [load])

  const csvColumns = [
    { key: 'full_name', header: 'Name' },
    { key: 'phone_number', header: 'Phone' },
    { key: 'role', header: 'Role' },
    { key: 'kyc_verified', header: 'KYC Verified' },
    { key: 'wallet_balance', header: 'Wallet Balance' },
    { key: 'completed_bookings', header: 'Completed Bookings' },
    { key: 'created_at', header: 'Joined' },
  ]

  const csvData = data.map((u) => ({
    full_name: u.full_name ?? '—',
    phone_number: u.phone_number ?? '—',
    role: u.role,
    kyc_verified: u.kyc_verified ? 'Yes' : 'No',
    wallet_balance: u.wallet_balance,
    completed_bookings: u.completed_bookings,
    created_at: formatIST(u.created_at, 'dd MMM yyyy'),
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage users and KYC verification</p>
        </div>
        <CsvExportButton data={csvData} columns={csvColumns} filename="users.csv" />
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {roles.map((tab) => (
            <button key={tab} onClick={() => setRoleTab(tab)} className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition', roleTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {kycFilters.map((tab) => (
            <button key={tab} onClick={() => setKycTab(tab)} className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition', kycTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={columns}
          data={data}
          isLoading={loading}
          onRowClick={(row) => router.push(`/dashboard/users/${row.id}`)}
          searchPlaceholder="Search name, phone, email…"
          globalFilter={search}
          onGlobalFilterChange={setSearch}
        />
      </div>
    </div>
  )
}
