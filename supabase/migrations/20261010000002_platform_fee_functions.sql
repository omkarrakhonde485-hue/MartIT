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
-- Search path secured against hijacking
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
SET search_path = public, pg_temp
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
-- Protected: only releases unpaid reservations
-- ============================================================================

CREATE OR REPLACE FUNCTION release_platform_fee(p_order_id VARCHAR(64))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
-- Prevents late verification from overwriting terminal states or expired windows
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_platform_fee_paid(p_order_id VARCHAR(64))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status payment_status_enum;
  v_window_exp TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Lock order row to verify current payment state
  SELECT payment_status, payment_window_expires_at INTO v_status, v_window_exp
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND'
      USING HINT = 'No order found with the specified identifier.';
  END IF;

  -- Idempotent success if already marked paid
  IF v_status = 'PAID' THEN
    RETURN TRUE;
  END IF;

  -- Guard: terminal states cannot be transitioned to PAID
  IF v_status IN ('EXPIRED', 'FAILED', 'REFUNDED') THEN
    RAISE EXCEPTION 'CANNOT_VERIFY_TERMINAL_PAYMENT'
      USING HINT = 'Order payment has already expired or failed and cannot be transitioned to PAID.';
  END IF;

  -- Guard: window expiry check
  IF v_now >= v_window_exp THEN
    RAISE EXCEPTION 'PAYMENT_WINDOW_EXPIRED'
      USING HINT = 'The 2-minute payment verification window has expired.';
  END IF;

  -- Mark order payment paid and transition order to CONFIRMED
  UPDATE orders
  SET
    payment_status = 'PAID',
    status = 'CONFIRMED',
    paid_at = v_now,
    updated_at = v_now
  WHERE id = p_order_id;

  -- Mark dynamic platform fee slot as paid (protects slot from reassignment)
  UPDATE platform_fee_reservations
  SET
    is_paid = TRUE,
    paid_at = v_now
  WHERE active_order_id = p_order_id;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 5. ATOMIC PAYMENT EXPIRATION FUNCTION
-- Server-authorized expiration: transitions PENDING/PROCESSING -> EXPIRED
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_order_payment(p_order_id VARCHAR(64))
RETURNS TABLE (
  expired BOOLEAN,
  previous_status payment_status_enum
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status payment_status_enum;
  v_window_exp TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT payment_status, payment_window_expires_at INTO v_status, v_window_exp
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- Only expire if in active pending/processing state and window has passed
  IF v_status IN ('PENDING', 'PROCESSING') AND v_now >= v_window_exp THEN
    UPDATE orders
    SET payment_status = 'EXPIRED',
        status = 'CANCELLED',
        updated_at = v_now
    WHERE id = p_order_id;

    -- Unbind order from fee slot so it enters cooldown
    UPDATE platform_fee_reservations
    SET active_order_id = NULL
    WHERE active_order_id = p_order_id AND is_paid = FALSE;

    RETURN QUERY SELECT TRUE, v_status;
  ELSE
    RETURN QUERY SELECT FALSE, v_status;
  END IF;
END;
$$;

-- ============================================================================
-- 6. ATOMIC INVENTORY RESERVATION FUNCTIONS
-- Concurrency-safe: uses SELECT FOR UPDATE on product rows
-- ============================================================================

CREATE OR REPLACE FUNCTION reserve_order_inventory(
  p_order_id VARCHAR(64),
  p_items JSONB,
  p_ttl_seconds INTEGER DEFAULT 420
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item RECORD;
  v_stock INTEGER;
  v_available BOOLEAN;
  v_now TIMESTAMPTZ := NOW();
  v_exp TIMESTAMPTZ := v_now + (p_ttl_seconds || ' seconds')::INTERVAL;
BEGIN
  FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(store_id VARCHAR, product_id VARCHAR, quantity INTEGER)
  LOOP
    -- Lock product row to prevent overselling
    SELECT stock, is_available INTO v_stock, v_available
    FROM products
    WHERE id = item.product_id AND store_id = item.store_id
    FOR UPDATE;

    IF v_stock IS NULL OR NOT v_available THEN
      RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'
        USING HINT = 'Product ' || item.product_id || ' is unavailable in store ' || item.store_id;
    END IF;

    IF v_stock < item.quantity THEN
      RAISE EXCEPTION 'OUT_OF_STOCK'
        USING HINT = 'Insufficient stock for product ' || item.product_id;
    END IF;

    -- Record reservation hold
    INSERT INTO inventory_reservations (id, order_id, store_id, product_id, quantity, status, expires_at, created_at)
    VALUES ('res_' || gen_random_uuid(), p_order_id, item.store_id, item.product_id, item.quantity, 'HELD', v_exp, v_now);

    -- Decrement stock atomically
    UPDATE products
    SET stock = stock - item.quantity, updated_at = v_now
    WHERE id = item.product_id AND store_id = item.store_id;
  END LOOP;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION release_order_inventory(p_order_id VARCHAR(64))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  res RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  FOR res IN
    SELECT product_id, store_id, quantity
    FROM inventory_reservations
    WHERE order_id = p_order_id AND status = 'HELD'
    FOR UPDATE
  LOOP
    UPDATE products
    SET stock = stock + res.quantity, updated_at = v_now
    WHERE id = res.product_id AND store_id = res.store_id;
  END LOOP;

  UPDATE inventory_reservations
  SET status = 'RELEASED', released_at = v_now
  WHERE order_id = p_order_id AND status = 'HELD';

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 7. REVOKE PRIVILEGES FROM CLIENT ROLES & GRANT EXCLUSIVELY TO SERVICE ROLE
-- Clients (anon / authenticated) CANNOT invoke these privileged functions directly
-- ============================================================================

REVOKE EXECUTE ON FUNCTION allocate_platform_fee(VARCHAR, VARCHAR, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION release_platform_fee(VARCHAR) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION mark_platform_fee_paid(VARCHAR) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION expire_order_payment(VARCHAR) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION reserve_order_inventory(VARCHAR, JSONB, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION release_order_inventory(VARCHAR) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION allocate_platform_fee(VARCHAR, VARCHAR, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION release_platform_fee(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION mark_platform_fee_paid(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION expire_order_payment(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION reserve_order_inventory(VARCHAR, JSONB, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION release_order_inventory(VARCHAR) TO service_role;
