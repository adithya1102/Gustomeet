'use client'

import { useEffect, useState, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/admin/data-table'
import { formatIST } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, X, Check, Pencil, Trash2, Eye, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PERMISSION_GROUPS, ROLE_LABELS, ROLE_COLORS, getPermissionsForRole, hasPermission, Permission } from '@/lib/permissions'

type Admin = {
  id: string
  employee_id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
  date_of_birth: string | null
  permissions: Permission[] | null
}

const schema = z.object({
  employee_id: z.string().min(1, 'Employee ID required'),
  full_name: z.string().min(1, 'Full name required'),
  email: z.string().email('Invalid email'),
  password: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'REVIEWER', 'FINANCE', 'SUPPORT', 'CLEANER_MANAGER']),
  date_of_birth: z.string().min(1, 'Date of birth required'),
  permissions: z.array(z.string()),
})

type FormData = z.infer<typeof schema>

export default function TeamPage() {
  const [data, setData] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [viewingPerms, setViewingPerms] = useState<Admin | null>(null)
  const [selectedRole, setSelectedRole] = useState('ADMIN')
  const [customPerms, setCustomPerms] = useState<Permission[]>([])
  const [useCustom, setUseCustom] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'ADMIN',
      permissions: [],
      password: '',
      employee_id: '',
      full_name: '',
      email: '',
      date_of_birth: '',
    },
  })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/team/admins')
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [])

  const checkPermissions = useCallback(async () => {
    const res = await fetch('/api/admin/me')
    const json = await res.json()
    if (json.admin?.permissions) {
      const perms = json.admin.permissions as Permission[]
      setCanManage(hasPermission(perms, 'team.manage' as Permission))
      setIsSuperAdmin(perms.some((p: string) => p === 'team.manage'))
    }
  }, [])

  useEffect(() => { load(); checkPermissions() }, [load, checkPermissions])

  function openCreate() {
    setEditingAdmin(null)
    form.reset({
      role: 'ADMIN',
      permissions: [],
      password: '',
      employee_id: '',
      full_name: '',
      email: '',
      date_of_birth: '',
    })
    setSelectedRole('ADMIN')
    setCustomPerms(getPermissionsForRole('ADMIN'))
    setUseCustom(false)
    setShowModal(true)
  }

  function openEdit(admin: Admin) {
    setEditingAdmin(admin)
    form.reset({
      employee_id: admin.employee_id,
      full_name: admin.full_name,
      email: admin.email,
      role: admin.role as any,
      date_of_birth: admin.date_of_birth || '',
      password: '',
      permissions: admin.permissions || getPermissionsForRole(admin.role),
    })
    setSelectedRole(admin.role)
    const perms = admin.permissions || getPermissionsForRole(admin.role)
    setCustomPerms(perms)
    setUseCustom(false)
    setShowModal(true)
  }

  function onRoleChange(role: string) {
    setSelectedRole(role)
    const defaults = getPermissionsForRole(role)
    setCustomPerms(defaults)
    form.setValue('role', role as any)
    form.setValue('permissions', defaults)
    setUseCustom(false)
  }

  function togglePerm(perm: Permission) {
    const next = customPerms.includes(perm)
      ? customPerms.filter((p) => p !== perm)
      : [...customPerms, perm]
    setCustomPerms(next)
    form.setValue('permissions', next)
  }

  async function onSubmit(values: FormData) {
    const perms = useCustom ? customPerms : getPermissionsForRole(values.role)

    if (editingAdmin) {
      // Edit existing
      const payload: any = {
        id: editingAdmin.id,
        full_name: values.full_name,
        email: values.email,
        role: values.role,
        date_of_birth: values.date_of_birth,
        permissions: perms,
      }
      if (values.password && values.password.length >= 6) {
        payload.password = values.password
      }
      if (isSuperAdmin) {
        payload.is_active = editingAdmin.is_active
      }

      const res = await fetch('/api/admin/team/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to update admin')
        console.error('Server error:', json)
        return
      }
      toast.success('Admin updated successfully')
    } else {
      // Create new
      const res = await fetch('/api/admin/team/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, permissions: perms }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to create admin')
        console.error('Server error:', json)
        return
      }
      toast.success('Admin created successfully')
    }

    form.reset()
    setShowModal(false)
    setEditingAdmin(null)
    setUseCustom(false)
    load()
  }

  async function toggleActive(admin: Admin) {
    const res = await fetch('/api/admin/team/admins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: admin.id, is_active: !admin.is_active }),
    })
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error || 'Failed to update status')
      return
    }
    toast.success(`Admin ${admin.is_active ? 'deactivated' : 'activated'}`)
    load()
  }

  async function deleteAdmin(id: string) {
    const res = await fetch(`/api/admin/team/admins?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error || 'Failed to delete admin')
      return
    }
    toast.success('Admin deleted')
    setDeleteConfirm(null)
    load()
  }

  const columns: ColumnDef<Admin>[] = [
    { accessorKey: 'employee_id', header: 'Employee ID' },
    { accessorKey: 'full_name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => {
        const role = getValue() as string
        return (
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600')}>
            {ROLE_LABELS[role] || role}
          </span>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ getValue, row }) =>
        getValue() ? (
          <span className="text-xs text-emerald-600 font-medium">Active</span>
        ) : (
          <span className="text-xs text-gray-400">Inactive</span>
        ),
    },
    {
      accessorKey: 'last_login_at',
      header: 'Last Login',
      cell: ({ getValue }) => (getValue() ? formatIST(getValue() as string, 'dd MMM yyyy') : 'Never'),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ getValue }) => formatIST(getValue() as string, 'dd MMM yyyy'),
    },
  ]

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
  const errorClass = 'text-xs text-red-500 mt-1'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin team and cleaning partners</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition">
            <Plus size={16} /> New Admin
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={columns}
          data={data}
          isLoading={loading}
          searchPlaceholder="Search team member…"
        />
        {/* Custom actions row */}
        <div className="mt-4 space-y-2">
          {data.map((admin) => (
            <div key={admin.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                <span className="font-medium text-gray-900">{admin.employee_id}</span>
                <span className="text-gray-600">{admin.full_name}</span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium w-fit', ROLE_COLORS[admin.role] ?? 'bg-gray-100 text-gray-600')}>
                  {ROLE_LABELS[admin.role] || admin.role}
                </span>
                <span className={cn('text-xs font-medium', admin.is_active ? 'text-emerald-600' : 'text-gray-400')}>
                  {admin.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-gray-400 text-xs">{admin.last_login_at ? formatIST(admin.last_login_at, 'dd MMM yyyy') : 'Never logged in'}</span>
              </div>
              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingPerms(admin)}
                    className="p-1.5 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                    title="View permissions"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => openEdit(admin)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit admin"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => toggleActive(admin)}
                    className={cn(
                      'px-2 py-1 text-xs font-medium rounded-lg transition',
                      admin.is_active
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    )}
                  >
                    {admin.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(admin.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete admin"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[32rem] max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">{editingAdmin ? 'Edit Admin' : 'Create New Admin'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input {...form.register('employee_id')} placeholder="Employee ID (e.g. ADM-003)" className={inputClass} disabled={!!editingAdmin} />
                {form.formState.errors.employee_id && <p className={errorClass}>{form.formState.errors.employee_id.message}</p>}
                {editingAdmin && <p className="text-xs text-gray-400 mt-1">Employee ID cannot be changed</p>}
              </div>

              <div>
                <input {...form.register('full_name')} placeholder="Full Name" className={inputClass} />
                {form.formState.errors.full_name && <p className={errorClass}>{form.formState.errors.full_name.message}</p>}
              </div>

              <div>
                <input {...form.register('email')} type="email" placeholder="Email" className={inputClass} />
                {form.formState.errors.email && <p className={errorClass}>{form.formState.errors.email.message}</p>}
              </div>

              <div>
                <input {...form.register('password')} type="password" placeholder={editingAdmin ? "Password (leave blank to keep current)" : "Password (min 6 chars)"} className={inputClass} />
                {form.formState.errors.password && <p className={errorClass}>{form.formState.errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input {...form.register('date_of_birth')} type="date" className={inputClass} />
                {form.formState.errors.date_of_birth && <p className={errorClass}>{form.formState.errors.date_of_birth.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  {...form.register('role')}
                  onChange={(e) => onRoleChange(e.target.value)}
                  className={inputClass}
                >
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="custom"
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => {
                    setUseCustom(e.target.checked)
                    if (!e.target.checked) {
                      setCustomPerms(getPermissionsForRole(selectedRole))
                      form.setValue('permissions', getPermissionsForRole(selectedRole))
                    }
                  }}
                  className="accent-emerald-500"
                />
                <label htmlFor="custom" className="text-sm text-gray-700">Custom permissions (override role defaults)</label>
              </div>

              {useCustom && (
                <div className="border rounded-lg p-3 space-y-3 max-h-60 overflow-y-auto">
                  <p className="text-xs text-gray-500 font-medium">Select permissions for this admin:</p>
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs font-medium text-gray-700 mb-1">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.permissions.map((perm) => (
                          <button
                            key={perm}
                            type="button"
                            onClick={() => togglePerm(perm)}
                            className={cn(
                              'px-2 py-1 text-xs rounded-md border transition',
                              customPerms.includes(perm)
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-gray-50 border-gray-200 text-gray-500'
                            )}
                          >
                            {customPerms.includes(perm) && <Check size={10} className="inline mr-1" />}
                            {perm.replace(/\./g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition">
                {editingAdmin ? 'Update Admin' : 'Create Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Permissions Modal */}
      {viewingPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={16} />
                Permissions: {viewingPerms.full_name}
              </h3>
              <button onClick={() => setViewingPerms(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Role: <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[viewingPerms.role])}>{ROLE_LABELS[viewingPerms.role]}</span></p>
              <div className="flex flex-wrap gap-2">
                {(viewingPerms.permissions || getPermissionsForRole(viewingPerms.role)).map((perm) => (
                  <span key={perm} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                    {perm.replace(/\./g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
            <h3 className="font-semibold text-gray-900 mb-2">Delete Admin?</h3>
            <p className="text-sm text-gray-500 mb-4">This action cannot be undone. The admin account will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition">Cancel</button>
              <button onClick={() => deleteAdmin(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
