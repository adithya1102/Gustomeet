-- ============================================================================
-- RLS Policies for Wallet System
-- Run this in Supabase SQL Editor after setup-wallet-functions.sql
-- ============================================================================

-- 1. Enable RLS on wallet_transactions (if not already enabled)
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts during re-run)
DROP POLICY IF EXISTS "Users view own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can only insert their own debit transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can only view their own balance" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all transactions" ON public.wallet_transactions;

-- 3. Users can only see transactions where they are the user OR the host
CREATE POLICY "Users view own transactions" ON public.wallet_transactions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = host_id OR
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'::user_role
    )
  );

-- 4. Service role can do everything (for admin panel + edge functions)
CREATE POLICY "Service role can manage all transactions" ON public.wallet_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Users can only see their own balance (users table RLS)
-- Note: users table may already have RLS enabled. Check first.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'users' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

CREATE POLICY "Users can only view their own balance" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 6. Users can only view their own profile data
CREATE POLICY "Users can only update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 7. Admin users can view all users (for admin panel)
CREATE POLICY "Admin users can view all users" ON public.users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'::user_role
    )
  );

-- 8. Bookings: users can only see their own bookings (guest or host)
-- First check if RLS is enabled on bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'bookings' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

CREATE POLICY "Users view own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = guest_id OR 
    auth.uid() IN (
      SELECT host_id FROM public.terraces WHERE id = bookings.terrace_id
    )
  );

-- 9. Terraces: hosts can manage their own, guests can view active+verified
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'terraces' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.terraces ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

CREATE POLICY "Hosts manage own terraces" ON public.terraces
  FOR ALL USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Guests view verified terraces" ON public.terraces
  FOR SELECT USING (is_active = true AND verification = 'VERIFIED');
