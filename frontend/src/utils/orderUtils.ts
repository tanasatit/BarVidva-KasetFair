import type { OrderItem, CartItem } from '@/types/api';

/**
 * Generate a unique order ID in DDMMXXX format
 * DD = day of month (01-31), MM = month (01-12), XXX = sequence (001-999)
 *
 * Example: "1401001" = January 14, Order 1
 *
 * Client-side generation for offline support.
 * Server validates uniqueness and may reassign.
 */
export function generateOrderId(dateKey?: number): string {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed

  // Generate random sequence for client-side (server will validate uniqueness)
  const sequence = Math.floor(Math.random() * 999) + 1;

  return `${dayOfMonth.toString().padStart(2, '0')}${month.toString().padStart(2, '0')}${sequence.toString().padStart(3, '0')}`;
}

/**
 * Get current date key in DDMM format as integer
 * Example: January 14 -> 1401
 */
export function getCurrentDateKey(): number {
  const now = new Date();
  return now.getDate() * 100 + (now.getMonth() + 1);
}

/**
 * Parse order ID to extract date components
 * @param orderId Order ID in DDMMXXX format
 * @returns { dayOfMonth, month, sequence }
 */
export function parseOrderId(orderId: string): {
  dayOfMonth: number;
  month: number;
  sequence: number;
} {
  if (orderId.length !== 7) {
    throw new Error('Invalid order ID format');
  }

  return {
    dayOfMonth: parseInt(orderId.substring(0, 2), 10),
    month: parseInt(orderId.substring(2, 4), 10),
    sequence: parseInt(orderId.substring(4, 7), 10),
  };
}

/**
 * Calculate total amount from cart items
 */
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Convert cart items to order items format
 */
export function cartToOrderItems(items: CartItem[]): OrderItem[] {
  return items.map((item) => ({
    menu_item_id: item.menu_item_id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));
}

/**
 * Format price in Thai Baht
 */
export function formatPrice(price: number): string {
  return `฿${price.toLocaleString()}`;
}

/**
 * @deprecated Use getCurrentDateKey() instead
 * Get current event day (1-9)
 * For testing, returns day 1. In production, calculate from event start date.
 */
export function getCurrentDay(): number {
  // Use getCurrentDateKey() for new code
  return getCurrentDateKey();
}

/**
 * Validate customer name
 */
export function validateCustomerName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'กรุณากรอกชื่อ';
  }
  if (trimmed.length < 2) {
    return 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
  }
  if (trimmed.length > 50) {
    return 'ชื่อต้องไม่เกิน 50 ตัวอักษร';
  }
  return null;
}
