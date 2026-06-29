-- ============================================================================
-- Fix admin_users schema: add permissions column, fix audit log
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Add permissions column to admin_users (for custom role permissions)
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT NULL;

-- 2. Backfill existing admin users with role-based permissions
UPDATE public.admin_users 
SET permissions = (
  CASE role
    WHEN 'SUPER_ADMIN' THEN jsonb_build_array(
      'dashboard', 'analytics', 'listings', 'listings.review', 'listings.approve',
      'bookings', 'bookings.manage', 'users', 'users.kyc', 'payouts', 'payouts.process',
      'reviews', 'reviews.moderate', 'damage_reports', 'damage_reports.resolve',
      'promo_codes', 'promo_codes.manage', 'platform_config', 'audit_log',
      'team.manage', 'team.admins', 'team.cleaners', 'wallet', 'wallet.transactions', 'wallet.manage'
    )
    WHEN 'ADMIN' THEN jsonb_build_array(
      'dashboard', 'analytics', 'listings', 'listings.review', 'listings.approve',
      'bookings', 'bookings.manage', 'users', 'users.kyc', 'payouts', 'payouts.process',
      'reviews', 'reviews.moderate', 'damage_reports', 'damage_reports.resolve',
      'promo_codes', 'promo_codes.manage', 'platform_config', 'audit_log',
      'team.manage', 'team.admins', 'team.cleaners', 'wallet', 'wallet.transactions', 'wallet.manage'
    )
    WHEN 'REVIEWER' THEN jsonb_build_array(
      'dashboard', 'listings', 'listings.review', 'bookings', 'users',
      'reviews', 'damage_reports'
    )
    WHEN 'FINANCE' THEN jsonb_build_array(
      'dashboard', 'analytics', 'payouts', 'payouts.process', 'bookings',
      'promo_codes', 'wallet'
    )
    WHEN 'SUPPORT' THEN jsonb_build_array(
      'dashboard', 'bookings', 'bookings.manage', 'users',
      'reviews', 'reviews.moderate', 'damage_reports'
    )
    WHEN 'CLEANER_MANAGER' THEN jsonb_build_array(
      'dashboard', 'bookings', 'bookings.manage', 'team.cleaners', 'damage_reports'
    )
    ELSE jsonb_build_array('dashboard')
  END
)
WHERE permissions IS NULL;

-- 3. Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_users' AND column_name = 'permissions';
