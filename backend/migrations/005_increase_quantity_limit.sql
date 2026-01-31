-- Migration 005: Increase quantity limit from 10 to 100
-- Created: 2026-01-31

-- Drop existing constraint and add new one with higher limit
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_quantity_check;
ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_check CHECK (quantity >= 1 AND quantity <= 100);
