-- Migration 006: Add category column to orders table for shop-based filtering
-- Created: 2026-01-31

-- Add category column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Backfill existing orders from their first item's menu category
UPDATE orders o
SET category = (
    SELECT mi.category
    FROM order_items oi
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    WHERE oi.order_id = o.id
    LIMIT 1
)
WHERE o.category IS NULL;

-- Index for filtering orders by category
CREATE INDEX IF NOT EXISTS idx_orders_category ON orders(category);
