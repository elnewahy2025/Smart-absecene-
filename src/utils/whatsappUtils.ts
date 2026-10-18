/**
 * WhatsApp Direct Messaging Utility
 * Generates verified, standard wa.me links for direct zero-cost WhatsApp Web / App messaging.
 */

export function cleanCallingCode(callingCode?: string): string {
  if (!callingCode) return '966';
  return callingCode.replace(/[^\d]/g, '') || '966';
}

/**
 * Normalizes phone numbers to standard international format without '+' or leading zeros
 * suitable for WhatsApp wa.me links (e.g., 966509990011).
 */
export function formatWhatsAppInternationalPhone(
  phone: string,
  defaultCallingCode: string = '966'
): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/[^\d]/g, '');
  const prefix = cleanCallingCode(defaultCallingCode);

  // If already starts with 00 (e.g. 00966...), strip 00
  if (digitsOnly.startsWith('00')) {
    return digitsOnly.slice(2);
  }

  // If starts with single 0 (local mobile format, e.g. 0509990011), replace leading 0 with country prefix
  if (digitsOnly.startsWith('0')) {
    return `${prefix}${digitsOnly.slice(1)}`;
  }

  // If digits start with the country prefix (e.g. 966...), return as-is
  if (digitsOnly.startsWith(prefix)) {
    return digitsOnly;
  }

  // If 9 digits (standard Saudi mobile without 0, e.g. 509990011), prepend prefix
  if (digitsOnly.length === 9) {
    return `${prefix}${digitsOnly}`;
  }

  return digitsOnly;
}

/**
 * Builds the standard https://wa.me/{phone}?text={encodedText} deep link.
 */
export function buildWhatsAppWebUrl(
  phone: string,
  messageText: string,
  defaultCallingCode: string = '966'
): string {
  const cleanPhone = formatWhatsAppInternationalPhone(phone, defaultCallingCode);
  const encodedMessage = encodeURIComponent(messageText.trim());
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Launches WhatsApp Web or Desktop/Mobile app directly in a new window/tab.
 */
export function openWhatsAppDirect(
  phone: string,
  messageText: string,
  defaultCallingCode: string = '966'
): boolean {
  if (typeof window === 'undefined') return false;
  const url = buildWhatsAppWebUrl(phone, messageText, defaultCallingCode);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  return Boolean(win);
}
