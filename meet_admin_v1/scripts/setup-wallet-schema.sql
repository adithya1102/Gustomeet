-- ============================================================================
-- Wallet Schema Updates for Gusto Meets
-- Run this in Supabase SQL Editor first
-- ============================================================================

-- 1. Add transaction_type column to wallet_transactions
ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS transaction_type TEXT 
CHECK (transaction_type IN ('CREDIT', 'DEBIT', 'REFUND', 'BONUS', 'HOST_PAYOUT', 'PLATFORM_FEE'));

-- Backfill existing rows with a default
UPDATE public.wallet_transactions 
SET transaction_type = CASE 
  WHEN amount > 0 THEN 'CREDIT'
  ELSE 'DEBIT'
END
WHERE transaction_type IS NULL;

-- 2. Add host_id column to wallet_transactions (for tracking who received money)
ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Add platform_fee column to wallet_transactions (for tracking fees deducted)
ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) DEFAULT 0.00 CHECK (platform_fee >= 0);

-- 4. Add a unique constraint on booking_id for DEBIT transactions to prevent duplicates
-- Only if there isn't a conflict. If there are duplicates, clean them first.
-- ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_tx_booking_unique 
-- UNIQUE (booking_id, transaction_type) WHERE transaction_type IN ('DEBIT', 'HOST_PAYOUT');

-- 5. Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions (transaction_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_booking ON public.wallet_transactions (booking_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_host ON public.wallet_transactions (host_id, created_at DESC);

-- 6. Verify the existing users table has wallet_balance (should already exist)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_balance';
