-- Migration: 20261010000001_initial_schema.sql
-- Description: Core schema for MartIT multi-store campus delivery
-- Target Database: Supabase PostgreSQL (15+)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE role_enum AS ENUM (
  'customer',
  'runner',
  'admin',
  'super_admin'
);

CREATE TYPE runner_status_enum AS ENUM (
  'applicant',
  'approved',
  'suspended'
);

CREATE TYPE order_status_enum AS ENUM (
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'PREPARING',
  'PICKING_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
);

CREATE TYPE payment_status_enum AS ENUM (
  'PENDING',
  'PROCESSING',
  'PAID',
  'EXPIRED',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE fulfillment_group_status_enum AS ENUM (
  'PENDING',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'FAILED_PICKUP',
  'CANCELLED'
);

CREATE TYPE reservation_status_enum AS ENUM (
  'HELD',
  'COMMITTED',
  'RELEASED'
);

-- ============================================================================
-- 1. USER PROFILES & ROLES
-- ============================================================================

-- Linked to Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email citext NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  runner_status runner_status_enum,
  default_location_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_runner_status ON profiles(runner_status);

-- Explicit role mapping table (prevent self-escalation)
CREATE TABLE user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role role_enum NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ============================================================================
-- 2. CAMPUS LOCATIONS & STORES
-- ============================================================================

CREATE TABLE locations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  group_name VARCHAR(60) NOT NULL, -- e.g. 'Hostels', 'Academic', 'Residential'
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_group ON locations(group_name);

CREATE TABLE stores (
  id VARCHAR(64) PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_open ON stores(is_open);

-- ============================================================================
-- 3. PRODUCTS & INVENTORY
-- ============================================================================

CREATE TABLE categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  pack VARCHAR(100),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  mrp NUMERIC(10, 2) NOT NULL CHECK (mrp >= price),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available, stock);

-- ============================================================================
-- 4. PARENT ORDERS
-- Owns combined payment, payable total, multi-stop route, and overall lifecycle.
-- ============================================================================

CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  delivery_location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  delivery_location_snapshot JSONB NOT NULL,
  
  -- State Machines
  status order_status_enum NOT NULL DEFAULT 'AWAITING_PAYMENT',
  payment_status payment_status_enum NOT NULL DEFAULT 'PENDING',
  
  -- Financial Snapshot (Authoritative Sums in Rupees)
  item_subtotal NUMERIC(10, 2) NOT NULL CHECK (item_subtotal >= 0),
  combined_delivery_fee NUMERIC(10, 2) NOT NULL CHECK (combined_delivery_fee >= 0),
  base_amount NUMERIC(10, 2) NOT NULL CHECK (base_amount >= 0),
  platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0.01 AND platform_fee <= 0.99),
  total_payable NUMERIC(10, 2) NOT NULL CHECK (total_payable >= 0),
  
  -- Multi-Stop Route Audit Snapshot
  route_distance_km NUMERIC(8, 4) NOT NULL CHECK (route_distance_km > 0 AND route_distance_km <= 5.0),
  route_stop_sequence JSONB NOT NULL,
  routing_provider VARCHAR(64) NOT NULL,
  routing_mode VARCHAR(32) NOT NULL,
  routing_metadata JSONB DEFAULT '{}'::jsonb,
  fee_policy_version VARCHAR(32) NOT NULL,
  
  -- Dynamic Platform Fee Payment Snapshot
  payment_attempt_id VARCHAR(64) NOT NULL,
  fee_paise INTEGER NOT NULL CHECK (fee_paise >= 1 AND fee_paise <= 99),
  payment_allocated_at TIMESTAMPTZ NOT NULL,
  payment_window_expires_at TIMESTAMPTZ NOT NULL,
  payment_cooldown_expires_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  
  -- Single Runner & Handover
  runner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  handover_otp_hash VARCHAR(128),
  handover_attempts_count INTEGER NOT NULL DEFAULT 0,
  handover_locked_until TIMESTAMPTZ,
  handover_verified_at TIMESTAMPTZ,
  
  -- Idempotency & Auditing
  idempotency_key VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_runner ON orders(runner_id);

-- ============================================================================
-- 5. STORE FULFILLMENT GROUPS
-- Partitions order fulfillment by participating physical store.
-- ============================================================================

CREATE TABLE order_fulfillment_groups (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  store_snapshot JSONB NOT NULL,
  pickup_sequence_index INTEGER NOT NULL CHECK (pickup_sequence_index >= 0),
  
  -- Group Status
  status fulfillment_group_status_enum NOT NULL DEFAULT 'PENDING',
  ready_for_pickup_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_order_store UNIQUE (order_id, store_id)
);

CREATE INDEX idx_fulfillment_groups_order ON order_fulfillment_groups(order_id);
CREATE INDEX idx_fulfillment_groups_store_status ON order_fulfillment_groups(store_id, status);

-- ============================================================================
-- 6. ORDER ITEMS (LINE ITEMS PER FULFILLMENT GROUP)
-- Immutable snapshots of purchased items.
-- ============================================================================

CREATE TABLE order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  fulfillment_group_id VARCHAR(64) NOT NULL REFERENCES order_fulfillment_groups(id) ON DELETE CASCADE,
  store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Purchase-Time Snapshots
  product_name VARCHAR(200) NOT NULL,
  product_pack VARCHAR(100),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  line_subtotal NUMERIC(10, 2) NOT NULL CHECK (line_subtotal >= 0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_group ON order_items(fulfillment_group_id);

-- ============================================================================
-- 7. INVENTORY RESERVATIONS
-- Atomic holds with expiration across checkout attempts.
-- ============================================================================

CREATE TABLE inventory_reservations (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  status reservation_status_enum NOT NULL DEFAULT 'HELD',
  expires_at TIMESTAMPTZ NOT NULL,
  committed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_reservations_order ON inventory_reservations(order_id);
CREATE INDEX idx_inventory_reservations_active ON inventory_reservations(store_id, product_id, status)
  WHERE status = 'HELD';

-- ============================================================================
-- 8. PLATFORM FEE RESERVATIONS
-- 99 slots (1–99 paise) for unique dynamic payment matching.
-- ============================================================================

CREATE TABLE platform_fee_reservations (
  fee_paise INTEGER PRIMARY KEY CHECK (fee_paise >= 1 AND fee_paise <= 99),
  active_order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
  attempt_id VARCHAR(64),
  allocated_at TIMESTAMPTZ,
  window_expires_at TIMESTAMPTZ,
  cooldown_expires_at TIMESTAMPTZ,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ
);

-- ============================================================================
-- 9. PAYMENT RECORDS & AUDIT LOGS
-- ============================================================================

CREATE TABLE payment_records (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  attempt_id VARCHAR(64) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status payment_status_enum NOT NULL,
  provider VARCHAR(64) NOT NULL DEFAULT 'UPI',
  verification_source VARCHAR(64),
  evidence TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_records_order ON payment_records(order_id);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(64),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_order_fulfillment_groups_updated_at BEFORE UPDATE ON order_fulfillment_groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
