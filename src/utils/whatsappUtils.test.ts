import { describe, it, expect } from 'vitest';
import {
  formatWhatsAppInternationalPhone,
  buildWhatsAppWebUrl,
  cleanCallingCode,
} from './whatsappUtils';

describe('WhatsApp Direct Web & Deep Link Utility Tests', () => {
  it('Cleans country calling codes correctly', () => {
    expect(cleanCallingCode('+966')).toBe('966');
    expect(cleanCallingCode('966')).toBe('966');
    expect(cleanCallingCode('+20')).toBe('20');
    expect(cleanCallingCode('')).toBe('966');
  });

  it('Formats local Saudi numbers (050xxxxxxx) to 96650xxxxxxx', () => {
    expect(formatWhatsAppInternationalPhone('0509990011', '966')).toBe('966509990011');
    expect(formatWhatsAppInternationalPhone('0551234567', '+966')).toBe('966551234567');
  });

  it('Formats already international numbers with plus or spaces (+966 50 999 0011)', () => {
    expect(formatWhatsAppInternationalPhone('+966 50 999 0011', '966')).toBe('966509990011');
    expect(formatWhatsAppInternationalPhone('+966-50-999-0011', '966')).toBe('966509990011');
  });

  it('Formats 9-digit mobile numbers without leading 0', () => {
    expect(formatWhatsAppInternationalPhone('509990011', '966')).toBe('966509990011');
  });

  it('Supports other Arab countries (e.g., Egypt +20, UAE +971)', () => {
    expect(formatWhatsAppInternationalPhone('01001234567', '+20')).toBe('201001234567');
    expect(formatWhatsAppInternationalPhone('+971501234567', '+971')).toBe('971501234567');
  });

  it('Constructs standard wa.me URL with properly encoded message text', () => {
    const phone = '+966509990011';
    const message = 'السلام عليكم ورحمة الله، نود إشعاركم بغياب نجلكم اليوم.';
    const url = buildWhatsAppWebUrl(phone, message, '966');

    expect(url).toContain('https://wa.me/966509990011?text=');
    expect(url).toContain(encodeURIComponent(message));
  });
});
