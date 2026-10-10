-- Migration: 20261010000003_row_level_security.sql
-- Description: Row Level Security (RLS) policies and least-privilege access rules
-- Target Database: Supabase PostgreSQL (15+)

-- ============================================================================
-- 1. SECURITY HELPER FUNCTIONS
-- ============================================================================

-- Checks whether the authenticated user has a specific role
CREATE OR REPLACE FUNCTION auth_user_has_role(required_role role_enum)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND (role = required_role OR role = 'super_admin')
  );
$$;

-- Checks whether the authenticated user is an administrator
CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND (role = 'admin' OR role = 'super_admin')
  );
$$;

-- Checks whether the authenticated user is a super administrator
CREATE OR REPLACE FUNCTION auth_is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  );
$$;

-- Checks whether the user is an approved runner
CREATE OR REPLACE FUNCTION auth_is_approved_runner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
      AND p.runner_status = 'approved'
      AND ur.role = 'runner'
  );
$$;

-- Checks if the user owns a specific store
CREATE OR REPLACE FUNCTION auth_owns_store(check_store_id VARCHAR(64))
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM stores
    WHERE id = check_store_id
      AND owner_id = auth.uid()
  );
$$;

-- Guard to prevent non-admins from changing runner_status or other protected fields on profile
CREATE OR REPLACE FUNCTION prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If not admin/super_admin, user cannot alter runner_status
  IF OLD.runner_status IS DISTINCT FROM NEW.runner_status AND NOT auth_is_admin() THEN
    RAISE EXCEPTION 'PERMISSION_DENIED_RUNNER_STATUS_MODIFICATION'
      USING HINT = 'Only administrators can update runner application status.';
  END IF;

  -- Users cannot change their id
  IF OLD.id IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'PERMISSION_DENIED_ID_CHANGE';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_profile_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_privilege_escalation();

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL USER-ACCESSIBLE TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_fulfillment_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. POLICIES: PROFILES
-- ============================================================================

-- User can view own profile; Admins can view all profiles; Assigned runner can view customer name
CREATE POLICY "profiles_select_own_or_admin"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR auth_is_admin()
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.customer_id = profiles.id
        AND orders.runner_id = auth.uid()
    )
  );

-- Users can update own non-privileged profile fields
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid() OR auth_is_admin())
  WITH CHECK (id = auth.uid() OR auth_is_admin());

-- Profile creation: typically automated by Supabase Auth trigger or user themselves on signup
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid() OR auth_is_admin());

-- ============================================================================
-- 4. POLICIES: USER ROLES (NO CLIENT SELF-ESCALATION)
-- ============================================================================

CREATE POLICY "user_roles_select"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid() OR auth_is_admin());

-- Only super admin (or server-side service role) can assign or modify roles
CREATE POLICY "user_roles_insert_super_admin"
  ON user_roles FOR INSERT
  WITH CHECK (auth_is_super_admin());

CREATE POLICY "user_roles_delete_super_admin"
  ON user_roles FOR DELETE
  USING (auth_is_super_admin());

-- ============================================================================
-- 5. POLICIES: LOCATIONS, STORES & CATALOGUE
-- ============================================================================

-- Locations: readable by everyone; writable only by admins
CREATE POLICY "locations_select_public"
  ON locations FOR SELECT
  USING (TRUE);

CREATE POLICY "locations_admin_all"
  ON locations FOR ALL
  USING (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- Stores: readable by everyone; store owner can update; admins have full access
CREATE POLICY "stores_select_public"
  ON stores FOR SELECT
  USING (TRUE);

CREATE POLICY "stores_owner_or_admin_update"
  ON stores FOR UPDATE
  USING (owner_id = auth.uid() OR auth_is_admin())
  WITH CHECK (owner_id = auth.uid() OR auth_is_admin());

-- Categories: readable by everyone; writable only by admins
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (TRUE);

CREATE POLICY "categories_admin_all"
  ON categories FOR ALL
  USING (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- Products: readable by everyone; store owner or admin can manage
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (TRUE);

CREATE POLICY "products_owner_or_admin_insert"
  ON products FOR INSERT
  WITH CHECK (auth_owns_store(store_id) OR auth_is_admin());

CREATE POLICY "products_owner_or_admin_update"
  ON products FOR UPDATE
  USING (auth_owns_store(store_id) OR auth_is_admin())
  WITH CHECK (auth_owns_store(store_id) OR auth_is_admin());

CREATE POLICY "products_owner_or_admin_delete"
  ON products FOR DELETE
  USING (auth_owns_store(store_id) OR auth_is_admin());

-- ============================================================================
-- 6. POLICIES: ORDERS & FULFILLMENT GROUPS
-- ============================================================================

-- Customer views own orders; Runner views assigned orders; Admins view all
CREATE POLICY "orders_select_customer_runner_admin"
  ON orders FOR SELECT
  USING (
    customer_id = auth.uid()
    OR runner_id = auth.uid()
    OR auth_is_admin()
  );

-- Server-authoritative creation & updates (only service role or admin can write orders directly)
CREATE POLICY "orders_service_or_admin_write"
  ON orders FOR ALL
  USING (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- Fulfillment Groups: Customer views their order groups; Runner views assigned order groups; Store owner views their store groups; Admin views all
CREATE POLICY "order_fulfillment_groups_select"
  ON order_fulfillment_groups FOR SELECT
  USING (
    auth_owns_store(store_id)
    OR auth_is_admin()
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_fulfillment_groups.order_id
        AND (orders.customer_id = auth.uid() OR orders.runner_id = auth.uid())
    )
  );

CREATE POLICY "order_fulfillment_groups_admin_all"
  ON order_fulfillment_groups FOR ALL
  USING (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- Order Items: Customer, Runner, Store Owner, Admin
CREATE POLICY "order_items_select"
  ON order_items FOR SELECT
  USING (
    auth_owns_store(store_id)
    OR auth_is_admin()
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (orders.customer_id = auth.uid() OR orders.runner_id = auth.uid())
    )
  );

-- Inventory Reservations: Store owner can view their store reservations; Admin views all
CREATE POLICY "inventory_reservations_select"
  ON inventory_reservations FOR SELECT
  USING (auth_owns_store(store_id) OR auth_is_admin());

-- Platform Fee Reservations: Admin only
CREATE POLICY "platform_fee_reservations_admin"
  ON platform_fee_reservations FOR SELECT
  USING (auth_is_admin());

-- Payment Records: Customer views own payments; Admin views all
CREATE POLICY "payment_records_select"
  ON payment_records FOR SELECT
  USING (
    auth_is_admin()
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_records.order_id
        AND orders.customer_id = auth.uid()
    )
  );

-- Audit Logs: Admin only
CREATE POLICY "audit_logs_admin_select"
  ON audit_logs FOR SELECT
  USING (auth_is_admin());
