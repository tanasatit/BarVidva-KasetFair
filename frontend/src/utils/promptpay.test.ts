import { describe, it, expect } from 'vitest';
import {
  generatePromptPayPayload,
  validatePromptPayAccount,
  formatAccountForDisplay,
} from './promptpay';

describe('promptpay utilities', () => {
  describe('generatePromptPayPayload', () => {
    it('generates payload for phone number without amount', () => {
      const payload = generatePromptPayPayload('0812345678');
      // Payload should be a non-empty string starting with EMVCo format
      expect(payload).toBeTruthy();
      expect(typeof payload).toBe('string');
      expect(payload.length).toBeGreaterThan(0);
    });

    it('generates payload for phone number with amount', () => {
      const payloadWithAmount = generatePromptPayPayload('0812345678', 100);
      const payloadWithoutAmount = generatePromptPayPayload('0812345678');

      // Payloads should be different when amount is included
      expect(payloadWithAmount).not.toBe(payloadWithoutAmount);
    });

    it('cleans phone number before generating payload', () => {
      const payload1 = generatePromptPayPayload('081-234-5678');
      const payload2 = generatePromptPayPayload('0812345678');

      // Both should produce the same payload
      expect(payload1).toBe(payload2);
    });

    it('handles zero amount as no amount', () => {
      const payloadZero = generatePromptPayPayload('0812345678', 0);
      const payloadNone = generatePromptPayPayload('0812345678');

      expect(payloadZero).toBe(payloadNone);
    });
  });

  describe('validatePromptPayAccount', () => {
    it('validates Thai phone number format (10 digits starting with 0)', () => {
      expect(validatePromptPayAccount('0812345678')).toBe(true);
      expect(validatePromptPayAccount('0970161250')).toBe(true);
      expect(validatePromptPayAccount('0912345678')).toBe(true);
    });

    it('validates international format (11 digits starting with 66)', () => {
      expect(validatePromptPayAccount('66812345678')).toBe(true);
      expect(validatePromptPayAccount('66970161250')).toBe(true);
    });

    it('handles formatted phone numbers', () => {
      expect(validatePromptPayAccount('081-234-5678')).toBe(true);
      expect(validatePromptPayAccount('097 016 1250')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(validatePromptPayAccount('1234567890')).toBe(false); // doesn't start with 0
      expect(validatePromptPayAccount('081234567')).toBe(false); // too short
      expect(validatePromptPayAccount('08123456789')).toBe(false); // too long for local
      expect(validatePromptPayAccount('12345')).toBe(false); // too short
      expect(validatePromptPayAccount('')).toBe(false); // empty
    });
  });

  describe('formatAccountForDisplay', () => {
    it('formats local Thai phone number', () => {
      expect(formatAccountForDisplay('0812345678')).toBe('081-234-5678');
      expect(formatAccountForDisplay('0970161250')).toBe('097-016-1250');
    });

    it('formats international phone number', () => {
      expect(formatAccountForDisplay('66812345678')).toBe('081-234-5678');
      expect(formatAccountForDisplay('66970161250')).toBe('097-016-1250');
    });

    it('formats PromptPay format (0066XXXXXXXXX)', () => {
      expect(formatAccountForDisplay('0066812345678')).toBe('081-234-5678');
    });

    it('handles already formatted numbers', () => {
      const formatted = formatAccountForDisplay('081-234-5678');
      expect(formatted).toBe('081-234-5678');
    });

    it('returns original for unknown formats', () => {
      expect(formatAccountForDisplay('12345')).toBe('12345');
      expect(formatAccountForDisplay('abc')).toBe('');
    });
  });
});
