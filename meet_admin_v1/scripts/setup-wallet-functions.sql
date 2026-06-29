-- ============================================================================
-- Wallet Functions for Gusto Meets
-- Run this in Supabase SQL Editor after setup-wallet-schema.sql
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: add_money_to_wallet
-- Passkey-based top-up (placeholder for Razorpay integration)
-- Passkey: '1321' (hardcoded for now, replace with Razorpay signature check later)
-- Min amount: 500
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_money_to_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_passkey TEXT DEFAULT '1321'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  -- Verify passkey (placeholder for Razorpay signature verification)
  IF p_passkey != '1321' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid passkey'
    );
  END IF;

  -- Verify minimum amount
  IF p_amount < 500 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Minimum amount is ₹500'
    );
  END IF;

  -- Update user balance (row-level lock for safety)
  UPDATE users
  SET wallet_balance = wallet_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING wallet_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Record transaction
  INSERT INTO wallet_transactions (
    user_id, amount, balance_after, description,
    transaction_type, created_at
  ) VALUES (
    p_user_id,
    p_amount,
    v_new_balance,
    'Wallet recharge via passkey',
    'CREDIT',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', '₹' || p_amount || ' added successfully',
    'new_balance', v_new_balance
  );
END;
$$;

-- ============================================================================
-- FUNCTION 2: process_booking_payment
-- Guest pays from wallet → host receives (minus 10% platform fee)
-- Atomic transaction: deduct guest, credit host, create booking, record tx
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_booking_payment(
  p_guest_id UUID,
  p_host_id UUID,
  p_terrace_id UUID,
  p_amount NUMERIC,
  p_duration_type TEXT,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_guest_count INTEGER,
  p_purpose TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_balance NUMERIC;
  v_booking_id UUID;
  v_platform_fee NUMERIC;
  v_host_payout NUMERIC;
  v_guest_new_balance NUMERIC;
  v_host_new_balance NUMERIC;
  v_duration_units NUMERIC;
BEGIN
  -- Lock guest row and check balance
  SELECT wallet_balance INTO v_guest_balance
  FROM users WHERE id = p_guest_id FOR UPDATE;

  IF v_guest_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Guest user not found');
  END IF;

  IF v_guest_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance');
  END IF;

  -- Calculate platform fee (10%) and host payout
  v_platform_fee := ROUND(p_amount * 0.10, 2);
  v_host_payout := p_amount - v_platform_fee;
  v_duration_units := 1; -- Default, can be calculated from start/end

  -- Deduct from guest wallet
  UPDATE users
  SET wallet_balance = wallet_balance - p_amount,
      completed_bookings = completed_bookings + 1,
      updated_at = NOW()
  WHERE id = p_guest_id
  RETURNING wallet_balance INTO v_guest_new_balance;

  -- Credit host wallet (minus platform fee)
  UPDATE users
  SET wallet_balance = wallet_balance + v_host_payout,
      updated_at = NOW()
  WHERE id = p_host_id
  RETURNING wallet_balance INTO v_host_new_balance;

  -- Create booking record
  INSERT INTO bookings (
    guest_id, terrace_id, duration_type, start_time, end_time,
    guest_count, purpose, status, duration_units, rate_per_unit,
    total_time_cost, platform_fee, utility_fee, cleaning_fee,
    total_charged, security_deposit, discount_amount, created_at, updated_at
  ) VALUES (
    p_guest_id, p_terrace_id, p_duration_type, p_start_time, p_end_time,
    p_guest_count, p_purpose, 'CONFIRMED', v_duration_units, p_amount,
    p_amount, v_platform_fee, 50, 0,  -- utility_fee=50, cleaning_fee=0 defaults
    p_amount, 0, 0, NOW(), NOW()
  )
  RETURNING id INTO v_booking_id;

  -- Record guest DEBIT transaction
  INSERT INTO wallet_transactions (
    user_id, amount, balance_after, description,
    booking_id, transaction_type, host_id, platform_fee, created_at
  ) VALUES (
    p_guest_id,
    -p_amount,
    v_guest_new_balance,
    'Booking payment #' || v_booking_id,
    v_booking_id,
    'DEBIT',
    p_host_id,
    v_platform_fee,
    NOW()
  );

  -- Record host HOST_PAYOUT transaction
  INSERT INTO wallet_transactions (
    user_id, amount, balance_after, description,
    booking_id, transaction_type, host_id, platform_fee, created_at
  ) VALUES (
    p_host_id,
    v_host_payout,
    v_host_new_balance,
    'Booking payout #' || v_booking_id,
    v_booking_id,
    'HOST_PAYOUT',
    NULL,
    0,
    NOW()
  );

  -- Record platform fee as separate transaction (optional, for admin tracking)
  INSERT INTO wallet_transactions (
    user_id, amount, balance_after, description,
    booking_id, transaction_type, host_id, platform_fee, created_at
  ) VALUES (
    p_host_id,
    -v_platform_fee,
    v_host_new_balance,
    'Platform fee on booking #' || v_booking_id,
    v_booking_id,
    'PLATFORM_FEE',
    NULL,
    v_platform_fee,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'amount_paid', p_amount,
    'platform_fee', v_platform_fee,
    'host_received', v_host_payout,
    'guest_new_balance', v_guest_new_balance,
    'host_new_balance', v_host_new_balance
  );
END;
$$;

-- ============================================================================
-- FUNCTION 3: process_refund
-- Reverse a booking payment: credit guest, debit host, mark booking CANCELLED
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_refund(
  p_booking_id UUID,
  p_reason TEXT DEFAULT 'Booking cancelled'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_guest_new_balance NUMERIC;
  v_host_new_balance NUMERIC;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM bookings WHERE id = p_booking_id;

  IF v_booking IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_booking.status = 'CANCELLED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking already cancelled');
  END IF;

  -- Credit full amount back to guest
  UPDATE users
  SET wallet_balance = wallet_balance + v_booking.total_charged,
      updated_at = NOW()
  WHERE id = v_booking.guest_id
  RETURNING wallet_balance INTO v_guest_new_balance;

  -- Debit host (reverse the payout they received)
  UPDATE users
  SET wallet_balance = wallet_balance - (v_booking.total_charged - v_booking.platform_fee),
      updated_at = NOW()
  WHERE id = (
    SELECT host_id FROM terraces WHERE id = v_booking.terrace_id
  )
  RETURNING wallet_balance INTO v_host_new_balance;

  -- Mark booking as cancelled
  UPDATE bookings
  SET status = 'CANCELLED', updated_at = NOW()
  WHERE id = p_booking_id;

  -- Record refund transaction for guest
  INSERT INTO wallet_transactions (
    user_id, amount, balance_after, description,
    booking_id, transaction_type, created_at
  ) VALUES (
    v_booking.guest_id,
    v_booking.total_charged,
    v_guest_new_balance,
    'Refund: ' || p_reason || ' #' || p_booking_id,
    p_booking_id,
    'REFUND',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'refund_amount', v_booking.total_charged,
    'guest_new_balance', v_guest_new_balance,
    'reason', p_reason
  );
END;
$$;

-- ============================================================================
-- FUNCTION 4: get_wallet_balance
-- Quick balance lookup with user details
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_wallet_balance(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_total_credit NUMERIC;
  v_total_debit NUMERIC;
BEGIN
  SELECT id, full_name, phone_number, wallet_balance INTO v_user
  FROM users WHERE id = p_user_id;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_credit
  FROM wallet_transactions
  WHERE user_id = p_user_id AND amount > 0;

  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_total_debit
  FROM wallet_transactions
  WHERE user_id = p_user_id AND amount < 0;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'name', v_user.full_name,
    'phone', v_user.phone_number,
    'balance', v_user.wallet_balance,
    'total_credited', v_total_credit,
    'total_spent', v_total_debit
  );
END;
$$;
