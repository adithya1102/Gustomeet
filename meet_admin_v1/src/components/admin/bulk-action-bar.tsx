'use client'

import { toast } from 'sonner'

interface BulkAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'danger' | 'secondary'
}

interface Props {
  selectedCount: number
  onClear: () => void
  actions: BulkAction[]
}

export default function BulkActionBar({ selectedCount, onClear, actions }: Props) {
  if (selectedCount === 0) return null

  const variantClass = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  }

  return (
    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200 mb-4">
      <span className="text-sm font-medium text-gray-700">
        {selectedCount} selected
      </span>
      <div className="flex-1" />
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={a.onClick}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${variantClass[a.variant ?? 'secondary']}`}
        >
          {a.label}
        </button>
      ))}
      <button
        onClick={onClear}
        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
      >
        Clear
      </button>
    </div>
  )
}
