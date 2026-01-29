-- Migration 004: Add payment_method column to orders table
-- Created: 2026-01-29
--
-- Adds payment_method column to track whether payment was made via PROMPTPAY or CASH

-- Add payment_method column (nullable for existing orders)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

-- Add index for payment method queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
