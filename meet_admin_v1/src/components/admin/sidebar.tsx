'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, List, CalendarDays, Users, LogOut, UserCircle, BarChart3, Banknote, ShieldAlert, Star, Ticket, Settings, ClipboardList, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAdminNotifications } from '@/hooks/useRealtimeNotifications'
import { hasAnyPermission, NAV_PERMISSION_MAP, Permission, ROLE_LABELS } from '@/lib/permissions'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true, badge: 'bookings' as const, perms: NAV_PERMISSION_MAP['/dashboard'] },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, perms: NAV_PERMISSION_MAP['/dashboard/analytics'] },
  { href: '/dashboard/listings', label: 'Listings', icon: List, badge: 'listings' as const, perms: NAV_PERMISSION_MAP['/dashboard/listings'] },
  { href: '/dashboard/bookings', label: 'Bookings', icon: CalendarDays, badge: 'bookings' as const, perms: NAV_PERMISSION_MAP['/dashboard/bookings'] },
  { href: '/dashboard/users', label: 'Users', icon: UserCircle, perms: NAV_PERMISSION_MAP['/dashboard/users'] },
  { href: '/dashboard/payouts', label: 'Payouts', icon: Banknote, perms: NAV_PERMISSION_MAP['/dashboard/payouts'] },
  { href: '/dashboard/reviews', label: 'Reviews', icon: Star, perms: NAV_PERMISSION_MAP['/dashboard/reviews'] },
  { href: '/dashboard/damage-reports', label: 'Damage Reports', icon: ShieldAlert, badge: 'damage' as const, perms: NAV_PERMISSION_MAP['/dashboard/damage-reports'] },
  { href: '/dashboard/team', label: 'Team', icon: Users, perms: NAV_PERMISSION_MAP['/dashboard/team'] },
  { href: '/dashboard/promo-codes', label: 'Promo Codes', icon: Ticket, perms: NAV_PERMISSION_MAP['/dashboard/promo-codes'] },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet, perms: NAV_PERMISSION_MAP['/dashboard/wallet'] },
  { href: '/dashboard/platform-config', label: 'Platform Config', icon: Settings, perms: NAV_PERMISSION_MAP['/dashboard/platform-config'] },
  { href: '/dashboard/audit-log', label: 'Audit Log', icon: ClipboardList, perms: NAV_PERMISSION_MAP['/dashboard/audit-log'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { unreadCount, lastEvent, reset } = useAdminNotifications()
  const [admin, setAdmin] = useState<{ name: string; role: string; permissions: Permission[] } | null>(null)

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.admin) setAdmin(d.admin)
      })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    toast.success('Logged out')
    router.push('/login')
  }

  const visibleNavItems = navItems.filter(
    (item) => !item.perms || hasAnyPermission(admin?.permissions, item.perms)
  )

  return (
    <aside className="w-60 min-h-screen bg-gray-900 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Gusto Meets</p>
            <p className="text-gray-400 text-xs">Admin Panel</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={reset} className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          const showBadge = badge && lastEvent === badge && unreadCount > 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition',
                active
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        {admin && (
          <div className="mb-4 px-3 py-2">
            <p className="text-white text-sm font-medium">{admin.name}</p>
            <p className="text-emerald-400 text-xs">{ROLE_LABELS[admin.role] || admin.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
