-- ==============================================================================
-- MartIT — Database Integrity, Constraint & Function Grant Tests
-- Run against a local/test PostgreSQL instance with:
--   psql "$TEST_DATABASE_URL" -f supabase/tests/database_integrity_test.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- TEST 1: Function Execution Grants
-- Verify that client roles (PUBLIC, anon, authenticated) CANNOT execute privileged functions
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- Test allocate_platform_fee
  IF has_function_privilege('anon', 'allocate_platform_fee(varchar, varchar, integer, integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'SECURITY FAIL: anon has EXECUTE on allocate_platform_fee';
  END IF;
  IF has_function_privilege('authenticated', 'allocate_platform_fee(varchar, varchar, integer, integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'SECURITY FAIL: authenticated has EXECUTE on allocate_platform_fee';
  END IF;

  -- Test mark_platform_fee_paid
  IF has_function_privilege('anon', 'mark_platform_fee_paid(varchar)', 'EXECUTE') THEN
    RAISE EXCEPTION 'SECURITY FAIL: anon has EXECUTE on mark_platform_fee_paid';
  END IF;
  IF has_function_privilege('authenticated', 'mark_platform_fee_paid(varchar)', 'EXECUTE') THEN
    RAISE EXCEPTION 'SECURITY FAIL: authenticated has EXECUTE on mark_platform_fee_paid';
  END IF;

  -- Test expire_order_payment
  IF has_function_privilege('anon', 'expire_order_payment(varchar)', 'EXECUTE') THEN
    RAISE EXCEPTION 'SECURITY FAIL: anon has EXECUTE on expire_order_payment';
  END IF;

  RAISE NOTICE '✓ TEST 1 PASSED: Client roles cannot execute privileged functions.';
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 2: Financial Integrity Constraints
-- Inconsistent totals must be rejected by PostgreSQL CHECK constraints
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_failed BOOLEAN := FALSE;
BEGIN
  -- Attempt inconsistent base_amount
  BEGIN
    INSERT INTO orders (
      id, customer_id, delivery_location_id, delivery_location_snapshot,
      item_subtotal, combined_delivery_fee, base_amount, platform_fee, total_payable,
      route_distance_km, route_stop_sequence, routing_provider, routing_mode, fee_policy_version,
      payment_attempt_id, fee_paise, payment_allocated_at, payment_window_expires_at, payment_cooldown_expires_at,
      idempotency_key
    ) VALUES (
      'ord_test_math_1', gen_random_uuid(), 'loc_hostel_a', '{"name":"Hostel"}'::jsonb,
      100.00, 15.00, 120.00, -- WRONG: 100 + 15 = 115, not 120
      0.15, 120.15, 1.0, '[]'::jsonb, 'straight_line', 'walking', '2026-10-09.1',
      'att_1', 15, NOW(), NOW() + interval '2 minutes', NOW() + interval '7 minutes',
      'idemp_math_1'
    );
  EXCEPTION WHEN check_violation THEN
    v_failed := TRUE;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'INTEGRITY FAIL: Inconsistent base_amount was accepted!';
  END IF;

  -- Attempt inconsistent total_payable
  v_failed := FALSE;
  BEGIN
    INSERT INTO orders (
      id, customer_id, delivery_location_id, delivery_location_snapshot,
      item_subtotal, combined_delivery_fee, base_amount, platform_fee, total_payable,
      route_distance_km, route_stop_sequence, routing_provider, routing_mode, fee_policy_version,
      payment_attempt_id, fee_paise, payment_allocated_at, payment_window_expires_at, payment_cooldown_expires_at,
      idempotency_key
    ) VALUES (
      'ord_test_math_2', gen_random_uuid(), 'loc_hostel_a', '{"name":"Hostel"}'::jsonb,
      100.00, 15.00, 115.00, 0.15,
      116.00, -- WRONG: 115 + 0.15 = 115.15, not 116.00
      1.0, '[]'::jsonb, 'straight_line', 'walking', '2026-10-09.1',
      'att_2', 15, NOW(), NOW() + interval '2 minutes', NOW() + interval '7 minutes',
      'idemp_math_2'
    );
  EXCEPTION WHEN check_violation THEN
    v_failed := TRUE;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'INTEGRITY FAIL: Inconsistent total_payable was accepted!';
  END IF;

  RAISE NOTICE '✓ TEST 2 PASSED: Orders financial check constraints reject inconsistent math.';
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 3: Cross-Store & Cross-Order Fulfillment Group Integrity
-- Order item MUST belong to the exact same order and store as its group
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_failed BOOLEAN := FALSE;
  v_cust_id UUID := gen_random_uuid();
BEGIN
  -- Insert dummy user profile if needed
  INSERT INTO profiles (id, email, name) VALUES (v_cust_id, 'test_integrity@campus.edu', 'Test Integrity')
  ON CONFLICT (id) DO NOTHING;

  -- Create order 1 and store A group
  INSERT INTO orders (
    id, customer_id, delivery_location_id, delivery_location_snapshot,
    item_subtotal, combined_delivery_fee, base_amount, platform_fee, total_payable,
    route_distance_km, route_stop_sequence, routing_provider, routing_mode, fee_policy_version,
    payment_attempt_id, fee_paise, payment_allocated_at, payment_window_expires_at, payment_cooldown_expires_at,
    idempotency_key
  ) VALUES (
    'ord_rel_1', v_cust_id, 'loc_hostel_a', '{"name":"Hostel"}'::jsonb,
    50.00, 10.00, 60.00, 0.05, 60.05, 0.4, '[]'::jsonb, 'straight_line', 'walking', '2026-10-09.1',
    'att_rel_1', 5, NOW(), NOW() + interval '2 minutes', NOW() + interval '7 minutes',
    'idemp_rel_1'
  );

  INSERT INTO order_fulfillment_groups (id, order_id, store_id, store_snapshot, pickup_sequence_index)
  VALUES ('grp_rel_1', 'ord_rel_1', 'store_campus_mart', '{"name":"Campus Mart"}'::jsonb, 0);

  -- Attempt to insert order item with store_night_canteen for grp_rel_1 (which is store_campus_mart)
  BEGIN
    INSERT INTO order_items (
      id, order_id, fulfillment_group_id, store_id, product_id,
      product_name, unit_price, quantity, line_subtotal
    ) VALUES (
      'item_rogue_1', 'ord_rel_1', 'grp_rel_1', 'store_night_canteen', 'p_nc_maggi',
      'Rogue Item', 65.00, 1, 65.00
    );
  EXCEPTION WHEN foreign_key_violation THEN
    v_failed := TRUE;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'INTEGRITY FAIL: Order item with mismatched store was accepted into fulfillment group!';
  END IF;

  RAISE NOTICE '✓ TEST 3 PASSED: Composite foreign key rejects items from mismatched stores or orders.';
END;
$$;

ROLLBACK;
