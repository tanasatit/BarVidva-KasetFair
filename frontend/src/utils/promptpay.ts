/**
 * PromptPay QR Code Utilities
 *
 * Uses the promptpay-qr library for generating EMVCo-compliant QR codes.
 * Reference: https://www.npmjs.com/package/promptpay-qr
 */

import generatePayload from 'promptpay-qr';

/**
 * Generate PromptPay QR code payload
 *
 * @param phoneNumber - Thai phone number (e.g., "0970161250")
 * @param amount - Payment amount in THB (optional for static QR)
 * @returns EMVCo-compliant QR code payload string
 */
export function generatePromptPayPayload(phoneNumber: string, amount?: number): string {
  // Clean the phone number (remove any non-digits)
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Generate payload using promptpay-qr library
  // Options object is required, but amount inside is optional
  return generatePayload(cleaned, { amount: amount && amount > 0 ? amount : undefined });
}

/**
 * Validate PromptPay phone number
 *
 * @param phoneNumber - Phone number to validate
 * @returns true if valid Thai phone number
 */
export function validatePromptPayAccount(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Thai phone: 10 digits starting with 0
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return true;
  }

  // International format: 11 digits starting with 66
  if (cleaned.length === 11 && cleaned.startsWith('66')) {
    return true;
  }

  return false;
}

/**
 * Format phone number for display
 *
 * @param phoneNumber - Phone number (various formats supported)
 * @returns Formatted string (e.g., "097-016-1250")
 */
export function formatAccountForDisplay(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Convert to local Thai format (0XXXXXXXXX)
  let localNumber: string;

  if (cleaned.startsWith('0066') && cleaned.length === 13) {
    // PromptPay format: 0066XXXXXXXXX -> 0XXXXXXXXX
    localNumber = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('66') && cleaned.length === 11) {
    // International format: 66XXXXXXXXX -> 0XXXXXXXXX
    localNumber = '0' + cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Already local format: 0XXXXXXXXX
    localNumber = cleaned;
  } else {
    // Unknown format, return as-is
    return cleaned;
  }

  // Format as 0XX-XXX-XXXX
  return `${localNumber.substring(0, 3)}-${localNumber.substring(3, 6)}-${localNumber.substring(6)}`;
}
