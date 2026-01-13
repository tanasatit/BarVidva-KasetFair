-- Migration 002: Add image_url to menu_items
-- Created: 2026-01-13

-- Add image_url column to menu_items table
-- Stores base64 data URLs or external image URLs
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;
