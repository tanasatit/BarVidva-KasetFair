import type { OrderItem, CartItem } from '@/types/api';

/**
 * Generate a unique order ID in DXXX format
 * D = day (1-9), XXX = sequence (001-999)
 *
 * Client-side generation for offline support.
 * Server validates uniqueness and may reassign.
 */
export function generateOrderId(day: number): string {
  if (day < 1 || day > 9) {
    throw new Error('Day must be between 1 and 9');
  }

  // Generate random sequence for client-side (server will validate uniqueness)
  const sequence = Math.floor(Math.random() * 999) + 1;
  return `${day}${sequence.toString().padStart(3, '0')}`;
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
 * Get current event day (1-9)
 * For testing, returns day 1. In production, calculate from event start date.
 */
export function getCurrentDay(): number {
  // TODO: Calculate from actual event start date
  // For now, return 1 for testing
  return 1;
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
