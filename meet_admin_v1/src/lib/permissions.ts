export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  ANALYTICS: 'analytics',
  LISTINGS: 'listings',
  LISTINGS_REVIEW: 'listings.review',
  LISTINGS_APPROVE: 'listings.approve',
  BOOKINGS: 'bookings',
  BOOKINGS_MANAGE: 'bookings.manage',
  USERS: 'users',
  USERS_KYC: 'users.kyc',
  PAYOUTS: 'payouts',
  PAYOUTS_PROCESS: 'payouts.process',
  REVIEWS: 'reviews',
  REVIEWS_MODERATE: 'reviews.moderate',
  DAMAGE_REPORTS: 'damage_reports',
  DAMAGE_REPORTS_RESOLVE: 'damage_reports.resolve',
  PROMO_CODES: 'promo_codes',
  PROMO_CODES_MANAGE: 'promo_codes.manage',
  PLATFORM_CONFIG: 'platform_config',
  AUDIT_LOG: 'audit_log',
  WALLET: 'wallet',
  WALLET_TRANSACTIONS: 'wallet.transactions',
  WALLET_MANAGE: 'wallet.manage',
  TEAM_MANAGE: 'team.manage',
  TEAM_ADMINS: 'team.admins',
  TEAM_CLEANERS: 'team.cleaners',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.ANALYTICS,
    PERMISSIONS.LISTINGS,
    PERMISSIONS.LISTINGS_REVIEW,
    PERMISSIONS.LISTINGS_APPROVE,
    PERMISSIONS.BOOKINGS,
    PERMISSIONS.BOOKINGS_MANAGE,
    PERMISSIONS.USERS,
    PERMISSIONS.USERS_KYC,
    PERMISSIONS.PAYOUTS,
    PERMISSIONS.PAYOUTS_PROCESS,
    PERMISSIONS.REVIEWS,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.DAMAGE_REPORTS,
    PERMISSIONS.DAMAGE_REPORTS_RESOLVE,
    PERMISSIONS.PROMO_CODES,
    PERMISSIONS.PROMO_CODES_MANAGE,
    PERMISSIONS.PLATFORM_CONFIG,
    PERMISSIONS.AUDIT_LOG,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.TEAM_ADMINS,
    PERMISSIONS.TEAM_CLEANERS,
    PERMISSIONS.WALLET,
    PERMISSIONS.WALLET_TRANSACTIONS,
    PERMISSIONS.WALLET_MANAGE,
  ],
  REVIEWER: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.LISTINGS,
    PERMISSIONS.LISTINGS_REVIEW,
    PERMISSIONS.BOOKINGS,
    PERMISSIONS.USERS,
    PERMISSIONS.REVIEWS,
    PERMISSIONS.DAMAGE_REPORTS,
  ],
  FINANCE: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.ANALYTICS,
    PERMISSIONS.PAYOUTS,
    PERMISSIONS.PAYOUTS_PROCESS,
    PERMISSIONS.BOOKINGS,
    PERMISSIONS.PROMO_CODES,
  ],
  SUPPORT: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.BOOKINGS,
    PERMISSIONS.BOOKINGS_MANAGE,
    PERMISSIONS.USERS,
    PERMISSIONS.REVIEWS,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.DAMAGE_REPORTS,
  ],
  CLEANER_MANAGER: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.BOOKINGS,
    PERMISSIONS.BOOKINGS_MANAGE,
    PERMISSIONS.TEAM_CLEANERS,
    PERMISSIONS.DAMAGE_REPORTS,
  ],
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  REVIEWER: 'Reviewer',
  FINANCE: 'Finance',
  SUPPORT: 'Support',
  CLEANER_MANAGER: 'Cleaner Manager',
}

export const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-violet-100 text-violet-700',
  REVIEWER: 'bg-blue-100 text-blue-700',
  FINANCE: 'bg-amber-100 text-amber-700',
  SUPPORT: 'bg-cyan-100 text-cyan-700',
  CLEANER_MANAGER: 'bg-emerald-100 text-emerald-700',
}

export const ALL_PERMISSIONS = Object.values(PERMISSIONS)

export const PERMISSION_GROUPS = [
  {
    label: 'Dashboard',
    permissions: [PERMISSIONS.DASHBOARD, PERMISSIONS.ANALYTICS],
  },
  {
    label: 'Listings',
    permissions: [PERMISSIONS.LISTINGS, PERMISSIONS.LISTINGS_REVIEW, PERMISSIONS.LISTINGS_APPROVE],
  },
  {
    label: 'Bookings',
    permissions: [PERMISSIONS.BOOKINGS, PERMISSIONS.BOOKINGS_MANAGE],
  },
  {
    label: 'Users',
    permissions: [PERMISSIONS.USERS, PERMISSIONS.USERS_KYC],
  },
  {
    label: 'Payouts',
    permissions: [PERMISSIONS.PAYOUTS, PERMISSIONS.PAYOUTS_PROCESS],
  },
  {
    label: 'Reviews',
    permissions: [PERMISSIONS.REVIEWS, PERMISSIONS.REVIEWS_MODERATE],
  },
  {
    label: 'Damage Reports',
    permissions: [PERMISSIONS.DAMAGE_REPORTS, PERMISSIONS.DAMAGE_REPORTS_RESOLVE],
  },
  {
    label: 'Promo Codes',
    permissions: [PERMISSIONS.PROMO_CODES, PERMISSIONS.PROMO_CODES_MANAGE],
  },
  {
    label: 'Platform Config',
    permissions: [PERMISSIONS.PLATFORM_CONFIG],
  },
  {
    label: 'Audit Log',
    permissions: [PERMISSIONS.AUDIT_LOG],
  },
  {
    label: 'Wallet',
    permissions: [PERMISSIONS.WALLET, PERMISSIONS.WALLET_TRANSACTIONS, PERMISSIONS.WALLET_MANAGE],
  },
  {
    label: 'Team',
    permissions: [PERMISSIONS.TEAM_MANAGE, PERMISSIONS.TEAM_ADMINS, PERMISSIONS.TEAM_CLEANERS],
  },
]

export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export function hasPermission(userPermissions: Permission[] | undefined, permission: Permission): boolean {
  if (!userPermissions) return false
  return userPermissions.includes('*' as Permission) || userPermissions.includes(permission)
}

export function hasAnyPermission(userPermissions: Permission[] | undefined, permissions: Permission[]): boolean {
  if (!userPermissions) return false
  return permissions.some((p) => hasPermission(userPermissions, p))
}

export function hasAllPermissions(userPermissions: Permission[] | undefined, permissions: Permission[]): boolean {
  if (!userPermissions) return false
  return permissions.every((p) => hasPermission(userPermissions, p))
}

export const NAV_PERMISSION_MAP: Record<string, Permission[]> = {
  '/dashboard': [PERMISSIONS.DASHBOARD],
  '/dashboard/analytics': [PERMISSIONS.ANALYTICS],
  '/dashboard/listings': [PERMISSIONS.LISTINGS],
  '/dashboard/bookings': [PERMISSIONS.BOOKINGS],
  '/dashboard/users': [PERMISSIONS.USERS],
  '/dashboard/payouts': [PERMISSIONS.PAYOUTS],
  '/dashboard/reviews': [PERMISSIONS.REVIEWS],
  '/dashboard/damage-reports': [PERMISSIONS.DAMAGE_REPORTS],
  '/dashboard/promo-codes': [PERMISSIONS.PROMO_CODES],
  '/dashboard/team': [PERMISSIONS.TEAM_MANAGE, PERMISSIONS.TEAM_ADMINS, PERMISSIONS.TEAM_CLEANERS],
  '/dashboard/platform-config': [PERMISSIONS.PLATFORM_CONFIG],
  '/dashboard/audit-log': [PERMISSIONS.AUDIT_LOG],
  '/dashboard/wallet': [PERMISSIONS.WALLET, PERMISSIONS.WALLET_TRANSACTIONS, PERMISSIONS.WALLET_MANAGE],
}

export const API_PERMISSION_MAP: Record<string, Permission[]> = {
  '/api/admin/analytics': [PERMISSIONS.ANALYTICS],
  '/api/admin/listings': [PERMISSIONS.LISTINGS],
  '/api/admin/bookings': [PERMISSIONS.BOOKINGS],
  '/api/admin/users': [PERMISSIONS.USERS],
  '/api/admin/payouts': [PERMISSIONS.PAYOUTS],
  '/api/admin/reviews': [PERMISSIONS.REVIEWS],
  '/api/admin/damage-reports': [PERMISSIONS.DAMAGE_REPORTS],
  '/api/admin/promo-codes': [PERMISSIONS.PROMO_CODES],
  '/api/admin/platform-config': [PERMISSIONS.PLATFORM_CONFIG],
  '/api/admin/audit-log': [PERMISSIONS.AUDIT_LOG],
  '/api/admin/team': [PERMISSIONS.TEAM_MANAGE],
  '/api/admin/cleaning-assignments': [PERMISSIONS.BOOKINGS_MANAGE, PERMISSIONS.TEAM_CLEANERS],
  '/api/admin/wallet': [PERMISSIONS.WALLET, PERMISSIONS.WALLET_TRANSACTIONS, PERMISSIONS.WALLET_MANAGE],
}
