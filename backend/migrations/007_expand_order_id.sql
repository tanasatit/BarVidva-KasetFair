-- Migration: Expand order ID from 7 to 8 characters
-- This allows 4-digit sequence numbers (0001-9999) instead of 3-digit (001-999)
-- Max capacity increases from 999 to 9999 orders per day

-- Expand order ID column in orders table
ALTER TABLE orders ALTER COLUMN id TYPE VARCHAR(8);

-- Expand order_id foreign key column in order_items table
ALTER TABLE order_items ALTER COLUMN order_id TYPE VARCHAR(8);
