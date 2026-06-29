'use client'

import { useEffect, useState, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import StatsCard from '@/components/admin/stats-card'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { IndianRupee, TrendingUp, ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react'

type Transaction = {
  id: string
  user: { full_name: string | null; phone_number: string | null } | null
  host: { full_name: string | null; phone_number: string | null } | null
  amount: number
  balance_after: number
  description: string
  booking_id: string | null
  transaction_type: string
  platform_fee: number
  created_at: string
}

type WalletUser = {
  id: string
  full_name: string | null
  phone_number: string | null
  role: string
  wallet_balance: number
  completed_bookings: number
  kyc_verified: boolean
  created_at: string
}

const typeBadge: Record<string, string> = {
  CREDIT: 'bg-emerald-100 text-emerald-700',
  DEBIT: 'bg-red-100 text-red-700',
  REFUND: 'bg-blue-100 text-blue-700',
  BONUS: 'bg-amber-100 text-amber-700',
  HOST_PAYOUT: 'bg-violet-100 text-violet-700',
  PLATFORM_FEE: 'bg-gray-100 text-gray-600',
}

const typeLabels: Record<string, string> = {
  CREDIT: 'Credit',
  DEBIT: 'Debit',
  REFUND: 'Refund',
  BONUS: 'Bonus',
  HOST_PAYOUT: 'Host Payout',
  PLATFORM_FEE: 'Platform Fee',
}

const txColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => row.original.user?.full_name ?? '—',
  },
  {
    accessorKey: 'transaction_type',
    header: 'Type',
    cell: ({ getValue }) => {
      const v = getValue() as string
      return (
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', typeBadge[v] ?? 'bg-gray-100 text-gray-600')}>
          {typeLabels[v] || v}
        </span>
      )
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ getValue, row }) => {
      const v = getValue() as number
      const isNegative = v < 0
      return (
        <span className={cn('font-medium', isNegative ? 'text-red-600' : 'text-emerald-600')}>
          {isNegative ? '−' : '+'}₹{Math.abs(v).toLocaleString('en-IN')}
        </span>
      )
    },
  },
  {
    accessorKey: 'balance_after',
    header: 'Balance After',
    cell: ({ getValue }) => `₹${(getValue() as number)?.toLocaleString('en-IN') ?? 0}`,
  },
  {
    accessorKey: 'platform_fee',
    header: 'Fee',
    cell: ({ getValue }) => (getValue() as number) > 0 ? `₹${(getValue() as number).toLocaleString('en-IN')}` : '—',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ getValue }) => <span className="line-clamp-1 max-w-xs">{getValue() as string}</span>,
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy, hh:mm a'),
  },
]

const userColumns: ColumnDef<WalletUser>[] = [
  { accessorKey: 'full_name', header: 'Name', cell: ({ row }) => row.original.full_name ?? '—' },
  { accessorKey: 'phone_number', header: 'Phone' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: 'wallet_balance',
    header: 'Balance',
    cell: ({ getValue }) => (
      <span className={cn('font-medium', (getValue() as number) > 0 ? 'text-emerald-600' : 'text-gray-400')}>
        ₹{(getValue() as number)?.toLocaleString('en-IN') ?? 0}
      </span>
    ),
  },
  { accessorKey: 'completed_bookings', header: 'Bookings' },
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
    accessorKey: 'created_at',
    header: 'Joined',
    cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy'),
  },
]

const txTypeTabs = ['All', 'Credit', 'Debit', 'Refund', 'Host Payout', 'Platform Fee']
const txTypeFilter: Record<string, string | null> = {
  All: null,
  Credit: 'CREDIT',
  Debit: 'DEBIT',
  Refund: 'REFUND',
  'Host Payout': 'HOST_PAYOUT',
  'Platform Fee': 'PLATFORM_FEE',
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState('transactions')
  const [txTypeTab, setTxTypeTab] = useState('All')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<WalletUser[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loadingTx, setLoadingTx] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)

  const loadTransactions = useCallback(async () => {
    setLoadingTx(true)
    const type = txTypeFilter[txTypeTab]
    const url = type ? `/api/admin/wallet/transactions?type=${type}` : '/api/admin/wallet/transactions'
    const res = await fetch(url)
    const json = await res.json()
    setTransactions(json.data ?? [])
    setLoadingTx(false)
  }, [txTypeTab])

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    const res = await fetch('/api/admin/wallet/users')
    const json = await res.json()
    setUsers(json.data ?? [])
    setLoadingUsers(false)
  }, [])

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    const res = await fetch('/api/admin/wallet/stats')
    const json = await res.json()
    setStats(json)
    setLoadingStats(false)
  }, [])

  useEffect(() => { loadTransactions() }, [loadTransactions])
  useEffect(() => { loadUsers() }, [loadUsers])
  useEffect(() => { loadStats() }, [loadStats])

  const tabs = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'users', label: 'User Balances' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-sm text-gray-500 mt-1">Manage wallet transactions and user balances</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Wallet Balance"
          value={loadingStats ? '...' : `₹${(stats?.stats?.totalWalletBalance ?? 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          color="emerald"
        />
        <StatsCard
          label="Today's Volume"
          value={loadingStats ? '...' : `₹${(stats?.stats?.todayVolume ?? 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          label="Platform Fees Collected"
          value={loadingStats ? '...' : `₹${(stats?.stats?.totalPlatformFees ?? 0).toLocaleString('en-IN')}`}
          icon={ArrowUpRight}
          color="amber"
        />
        <StatsCard
          label="Today's Transactions"
          value={loadingStats ? '...' : `${stats?.stats?.todayCount ?? 0}`}
          icon={ArrowDownLeft}
          color="violet"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition',
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' && (
        <>
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            {txTypeTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setTxTypeTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition',
                  txTypeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <DataTable
              columns={txColumns}
              data={transactions}
              isLoading={loadingTx}
              searchPlaceholder="Search transactions..."
            />
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <DataTable
            columns={userColumns}
            data={users}
            isLoading={loadingUsers}
            searchPlaceholder="Search users..."
          />
        </div>
      )}
    </div>
  )
}
