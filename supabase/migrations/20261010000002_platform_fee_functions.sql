-- Migration: 20261010000002_platform_fee_functions.sql
-- Description: Dynamic platform fee slot seed and atomic allocation stored functions
-- Target Database: Supabase PostgreSQL (15+)

-- ============================================================================
-- 1. SEED 99 DYNAMIC PLATFORM FEE SLOTS (1 to 99 paise)
-- ============================================================================

INSERT INTO platform_fee_reservations (fee_paise)
SELECT generate_series(1, 99)
ON CONFLICT (fee_paise) DO NOTHING;

-- ============================================================================
-- 2. ATOMIC PLATFORM FEE ALLOCATION FUNCTION
-- Concurrency-safe: uses FOR UPDATE SKIP LOCKED
-- ============================================================================

CREATE OR REPLACE FUNCTION allocate_platform_fee(
  p_order_id VARCHAR(64),
  p_attempt_id VARCHAR(64),
  p_window_seconds INTEGER DEFAULT 120,   -- 2-minute verification window
  p_cooldown_seconds INTEGER DEFAULT 300  -- 5-minute cooldown
)
RETURNS TABLE (
  allocated_fee_paise INTEGER,
  allocated_at TIMESTAMPTZ,
  window_expires_at TIMESTAMPTZ,
  cooldown_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_paise INTEGER;
  v_now TIMESTAMPTZ := NOW();
  v_window_exp TIMESTAMPTZ := v_now + (p_window_seconds || ' seconds')::INTERVAL;
  v_cooldown_exp TIMESTAMPTZ := v_window_exp + (p_cooldown_seconds || ' seconds')::INTERVAL;
BEGIN
  -- Select smallest available paise slot with row-level lock
  SELECT fee_paise INTO v_paise
  FROM platform_fee_reservations
  WHERE (active_order_id IS NULL OR v_now >= cooldown_expires_at)
    AND is_paid = FALSE
  ORDER BY fee_paise ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_paise IS NULL THEN
    RAISE EXCEPTION 'ALL_PLATFORM_FEE_SLOTS_BUSY'
      USING HINT = 'All 99 platform fee verification slots are currently active or in cooldown. Please retry in a moment.';
  END IF;

  -- Update the selected slot
  UPDATE platform_fee_reservations
  SET
    active_order_id = p_order_id,
    attempt_id = p_attempt_id,
    allocated_at = v_now,
    window_expires_at = v_window_exp,
    cooldown_expires_at = v_cooldown_exp,
    is_paid = FALSE,
    paid_at = NULL
  WHERE fee_paise = v_paise;

  RETURN QUERY SELECT v_paise, v_now, v_window_exp, v_cooldown_exp;
END;
$$;

-- ============================================================================
-- 3. RELEASE PLATFORM FEE FUNCTION (e.g. on order creation failure / cancellation)
-- ============================================================================

CREATE OR REPLACE FUNCTION release_platform_fee(p_order_id VARCHAR(64))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE platform_fee_reservations
  SET
    active_order_id = NULL,
    attempt_id = NULL,
    allocated_at = NULL,
    window_expires_at = NULL,
    cooldown_expires_at = NULL
  WHERE active_order_id = p_order_id
    AND is_paid = FALSE;
  
  RETURN FOUND;
END;
$$;

-- ============================================================================
-- 4. MARK PLATFORM FEE PAID FUNCTION (server-verified payment evidence only)
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_platform_fee_paid(p_order_id VARCHAR(64))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE platform_fee_reservations
  SET
    is_paid = TRUE,
    paid_at = NOW()
  WHERE active_order_id = p_order_id;
  
  RETURN FOUND;
END;
$$;
