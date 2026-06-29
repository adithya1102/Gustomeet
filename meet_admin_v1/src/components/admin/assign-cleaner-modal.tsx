'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

interface Partner {
  id: string
  name: string
  phone: string
  is_active: boolean
}

interface Props {
  bookingId: string
  open: boolean
  onClose: () => void
  onAssigned: () => void
}

export default function AssignCleanerModal({ bookingId, open, onClose, onAssigned }: Props) {
  const [partners, setPartners] = useState<Partner[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/admin/team/cleaners')
      .then((r) => r.json())
      .then((d) => setPartners((d.data ?? []).filter((p: Partner) => p.is_active)))
  }, [open])

  async function handleAssign() {
    if (!selectedId) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, partnerId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Cleaner assigned')
      onAssigned()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 w-96">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-semibold text-gray-900">Assign Cleaner</Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {partners.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No active cleaners</p>}
            {partners.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition"
              >
                <input
                  type="radio"
                  name="partner"
                  value={p.id}
                  checked={selectedId === p.id}
                  onChange={() => setSelectedId(p.id)}
                  className="accent-emerald-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.phone}</p>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleAssign}
            disabled={!selectedId || loading}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Assigning…' : 'Assign'}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
