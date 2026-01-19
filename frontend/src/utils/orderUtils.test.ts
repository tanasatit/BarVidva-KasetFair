import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateOrderId,
  getCurrentDateKey,
  parseOrderId,
  calculateTotal,
  cartToOrderItems,
  formatPrice,
  validateCustomerName,
} from './orderUtils';
import type { CartItem } from '@/types/api';

describe('orderUtils', () => {
  describe('generateOrderId', () => {
    beforeEach(() => {
      // Mock Date to January 14, 2026
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 14, 10, 30, 0)); // January 14, 2026 10:30:00
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('generates order ID in DDMMXXX format', () => {
      const orderId = generateOrderId();
      // Should be 7 characters: 2 digits day + 2 digits month + 3 digits sequence
      expect(orderId).toHaveLength(7);
      expect(orderId).toMatch(/^\d{7}$/);
    });

    it('includes correct day and month', () => {
      const orderId = generateOrderId();
      // January 14 -> 1401XXX
      expect(orderId.substring(0, 4)).toBe('1401');
    });

    it('generates sequence between 001 and 999', () => {
      const orderId = generateOrderId();
      const sequence = parseInt(orderId.substring(4, 7), 10);
      expect(sequence).toBeGreaterThanOrEqual(1);
      expect(sequence).toBeLessThanOrEqual(999);
    });
  });

  describe('getCurrentDateKey', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns correct date key for January 14', () => {
      vi.setSystemTime(new Date(2026, 0, 14));
      expect(getCurrentDateKey()).toBe(1401);
    });

    it('returns correct date key for February 7', () => {
      vi.setSystemTime(new Date(2026, 1, 7));
      expect(getCurrentDateKey()).toBe(702);
    });

    it('returns correct date key for December 31', () => {
      vi.setSystemTime(new Date(2026, 11, 31));
      expect(getCurrentDateKey()).toBe(3112);
    });

    it('returns correct date key for January 1', () => {
      vi.setSystemTime(new Date(2026, 0, 1));
      expect(getCurrentDateKey()).toBe(101);
    });
  });

  describe('parseOrderId', () => {
    it('parses valid order ID correctly', () => {
      const result = parseOrderId('1401001');
      expect(result).toEqual({
        dayOfMonth: 14,
        month: 1,
        sequence: 1,
      });
    });

    it('parses order ID with high sequence number', () => {
      const result = parseOrderId('0702999');
      expect(result).toEqual({
        dayOfMonth: 7,
        month: 2,
        sequence: 999,
      });
    });

    it('throws error for invalid length', () => {
      expect(() => parseOrderId('1401')).toThrow('Invalid order ID format');
      expect(() => parseOrderId('14010001')).toThrow('Invalid order ID format');
    });
  });

  describe('calculateTotal', () => {
    it('returns 0 for empty cart', () => {
      expect(calculateTotal([])).toBe(0);
    });

    it('calculates total for single item', () => {
      const items: CartItem[] = [
        { menu_item_id: 1, name: 'Fries S', price: 35, quantity: 1 },
      ];
      expect(calculateTotal(items)).toBe(35);
    });

    it('calculates total for multiple items', () => {
      const items: CartItem[] = [
        { menu_item_id: 1, name: 'Fries S', price: 35, quantity: 2 },
        { menu_item_id: 2, name: 'Fries M', price: 45, quantity: 1 },
        { menu_item_id: 3, name: 'Fries L', price: 55, quantity: 3 },
      ];
      // 35*2 + 45*1 + 55*3 = 70 + 45 + 165 = 280
      expect(calculateTotal(items)).toBe(280);
    });

    it('handles decimal prices correctly', () => {
      const items: CartItem[] = [
        { menu_item_id: 1, name: 'Item', price: 10.5, quantity: 2 },
      ];
      expect(calculateTotal(items)).toBe(21);
    });
  });

  describe('cartToOrderItems', () => {
    it('converts empty cart to empty array', () => {
      expect(cartToOrderItems([])).toEqual([]);
    });

    it('converts cart items to order items', () => {
      const cartItems: CartItem[] = [
        { menu_item_id: 1, name: 'Fries S', price: 35, quantity: 2 },
        { menu_item_id: 2, name: 'Fries M', price: 45, quantity: 1 },
      ];

      const result = cartToOrderItems(cartItems);

      expect(result).toEqual([
        { menu_item_id: 1, name: 'Fries S', price: 35, quantity: 2 },
        { menu_item_id: 2, name: 'Fries M', price: 45, quantity: 1 },
      ]);
    });
  });

  describe('formatPrice', () => {
    it('formats price with Thai Baht symbol', () => {
      expect(formatPrice(35)).toBe('฿35');
    });

    it('formats price with thousand separator', () => {
      expect(formatPrice(1000)).toBe('฿1,000');
      expect(formatPrice(10000)).toBe('฿10,000');
    });

    it('formats zero price', () => {
      expect(formatPrice(0)).toBe('฿0');
    });
  });

  describe('validateCustomerName', () => {
    it('returns null for valid names', () => {
      expect(validateCustomerName('John')).toBeNull();
      expect(validateCustomerName('สมชาย')).toBeNull();
      expect(validateCustomerName('Jo')).toBeNull(); // minimum 2 chars
      expect(validateCustomerName('A'.repeat(50))).toBeNull(); // maximum 50 chars
    });

    it('returns error for empty name', () => {
      expect(validateCustomerName('')).toBe('กรุณากรอกชื่อ');
      expect(validateCustomerName('   ')).toBe('กรุณากรอกชื่อ');
    });

    it('returns error for name too short', () => {
      expect(validateCustomerName('A')).toBe('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
    });

    it('returns error for name too long', () => {
      expect(validateCustomerName('A'.repeat(51))).toBe('ชื่อต้องไม่เกิน 50 ตัวอักษร');
    });

    it('trims whitespace before validation', () => {
      expect(validateCustomerName('  John  ')).toBeNull();
      expect(validateCustomerName('  A  ')).toBe('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
    });
  });
});
