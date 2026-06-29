'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

const adminSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
})

const cleanerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
})

type AdminForm = z.infer<typeof adminSchema>
type CleanerForm = z.infer<typeof cleanerSchema>

interface Props {
  type: 'admin' | 'cleaner'
  open: boolean
  onClose: () => void
  onAdded: () => void
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-red-500 mt-0.5">{msg}</p>
}

export default function AddTeamMemberModal({ type, open, onClose, onAdded }: Props) {
  const [loading, setLoading] = useState(false)

  const adminForm = useForm<AdminForm>({ resolver: zodResolver(adminSchema), defaultValues: { role: 'ADMIN' } })
  const cleanerForm = useForm<CleanerForm>({ resolver: zodResolver(cleanerSchema) })

  async function submitAdmin(values: AdminForm) {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/team/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Admin added')
      adminForm.reset()
      onAdded()
      onClose()
    } finally { setLoading(false) }
  }

  async function submitCleaner(values: CleanerForm) {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/team/cleaners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Cleaning partner added')
      cleanerForm.reset()
      onAdded()
      onClose()
    } finally { setLoading(false) }
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 w-96">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="font-semibold text-gray-900">
              {type === 'admin' ? 'Add Admin User' : 'Add Cleaning Partner'}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          {type === 'admin' ? (
            <form onSubmit={adminForm.handleSubmit(submitAdmin)} className="space-y-3">
              <div>
                <input {...adminForm.register('employeeId')} placeholder="Employee ID (e.g. ADM-002)" className={inputClass} />
                <FieldError msg={adminForm.formState.errors.employeeId?.message} />
              </div>
              <div>
                <input {...adminForm.register('name')} placeholder="Full Name" className={inputClass} />
                <FieldError msg={adminForm.formState.errors.name?.message} />
              </div>
              <div>
                <input {...adminForm.register('email')} placeholder="Email" type="email" className={inputClass} />
                <FieldError msg={adminForm.formState.errors.email?.message} />
              </div>
              <div>
                <input {...adminForm.register('password')} placeholder="Password (min 8 chars)" type="password" className={inputClass} />
                <FieldError msg={adminForm.formState.errors.password?.message} />
              </div>
              <div>
                <select {...adminForm.register('role')} className={inputClass}>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
                {loading ? 'Adding…' : 'Add Admin'}
              </button>
            </form>
          ) : (
            <form onSubmit={cleanerForm.handleSubmit(submitCleaner)} className="space-y-3">
              <div>
                <input {...cleanerForm.register('name')} placeholder="Full Name" className={inputClass} />
                <FieldError msg={cleanerForm.formState.errors.name?.message} />
              </div>
              <div>
                <input {...cleanerForm.register('phone')} placeholder="Phone Number" className={inputClass} />
                <FieldError msg={cleanerForm.formState.errors.phone?.message} />
              </div>
              <div>
                <input {...cleanerForm.register('email')} placeholder="Email (optional)" type="email" className={inputClass} />
                <FieldError msg={cleanerForm.formState.errors.email?.message} />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
                {loading ? 'Adding…' : 'Add Partner'}
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
