-- Migration 003: Update order ID format from DXXX to DDMMXXX
-- Created: 2026-01-14
--
-- Changes:
-- 1. Expand orders.id from VARCHAR(4) to VARCHAR(7)
-- 2. Expand order_items.order_id from VARCHAR(4) to VARCHAR(7)
-- 3. Rename 'day' column to 'date_key' (stores DDMM as integer)
-- 4. Update constraint from day 1-9 to date_key 101-3112
-- 5. Update unique constraint

-- Step 1: Drop the unique constraint on (day, id)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_day_id_key;

-- Step 2: Drop the foreign key constraint on order_items
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

-- Step 3: Alter orders.id column to VARCHAR(7)
ALTER TABLE orders ALTER COLUMN id TYPE VARCHAR(7);

-- Step 4: Alter order_items.order_id column to VARCHAR(7)
ALTER TABLE order_items ALTER COLUMN order_id TYPE VARCHAR(7);

-- Step 5: Rename 'day' column to 'date_key'
ALTER TABLE orders RENAME COLUMN day TO date_key;

-- Step 6: Drop old check constraint and add new one for date_key
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_day_check;
ALTER TABLE orders ADD CONSTRAINT orders_date_key_check CHECK (date_key >= 101 AND date_key <= 3112);

-- Step 7: Add new unique constraint on (date_key, id)
ALTER TABLE orders ADD CONSTRAINT orders_date_key_id_key UNIQUE (date_key, id);

-- Step 8: Re-add foreign key constraint
ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Step 9: Update index (drop old, create new)
DROP INDEX IF EXISTS idx_orders_day;
CREATE INDEX IF NOT EXISTS idx_orders_date_key ON orders(date_key);

-- Note: Existing orders with old format (DXXX) will need manual migration
-- For new installations, this is not an issue
-- For existing data, run a data migration script before this DDL migration
