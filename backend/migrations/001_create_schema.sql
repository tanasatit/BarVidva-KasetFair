-- Migration 001: Create initial schema
-- Created: 2025-12-30

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0 AND price <= 10000),
    category VARCHAR(50),
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(4) PRIMARY KEY,
    customer_name VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT',
    day INTEGER NOT NULL CHECK (day >= 1 AND day <= 9),
    queue_number INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(day, id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(4) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 10)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_day ON orders(day);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Seed initial menu items (French Fries S/M/L)
INSERT INTO menu_items (name, price, category, available) VALUES
    ('French Fries S', 40.00, 'Fries', true),
    ('French Fries M', 60.00, 'Fries', true),
    ('French Fries L', 80.00, 'Fries', true)
ON CONFLICT (name) DO NOTHING;
