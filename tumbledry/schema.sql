-- ================================================================
-- TUMBLEDRY POS — Neon PostgreSQL Schema
-- Run this in your Neon SQL Editor to set up the database
-- ================================================================

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  customer_name   TEXT NOT NULL,
  customer_number TEXT NOT NULL,
  customer_address TEXT DEFAULT '',
  customer_city   TEXT DEFAULT '',
  customer_pincode TEXT DEFAULT '',
  tag_number      TEXT UNIQUE NOT NULL,
  service_type    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  payment_method  TEXT DEFAULT 'Cash',
  payment_status  TEXT DEFAULT 'Pending',
  grand_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_garments  INTEGER NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  discount_pct    NUMERIC(5,2) DEFAULT 0,
  cart            JSONB DEFAULT '[]',
  order_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_date   TEXT DEFAULT '',
  deleted         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_number ON orders(customer_number);
CREATE INDEX IF NOT EXISTS idx_orders_tag_number ON orders(tag_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_deleted ON orders(deleted);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  date      DATE PRIMARY KEY,
  jamil     TEXT NOT NULL DEFAULT 'Working',
  ajaz      TEXT NOT NULL DEFAULT 'Working',
  moomin    TEXT NOT NULL DEFAULT 'Working',
  shahid    TEXT NOT NULL DEFAULT 'Working',
  shabir    TEXT NOT NULL DEFAULT 'Working',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on orders
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- VERIFY setup
-- ================================================================
SELECT 'orders table' as table_name, COUNT(*) as rows FROM orders
UNION ALL
SELECT 'attendance table', COUNT(*) FROM attendance;
