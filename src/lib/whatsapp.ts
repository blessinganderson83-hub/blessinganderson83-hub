/** Normalise a phone number to international form for a wa.me link, or null if invalid. */
export function toWhatsAppNumber(raw: string): string | null {
  // Keep digits and an optional leading +, drop spaces, dashes, brackets
  const plus = raw.trim().startsWith('+');
  const digits = raw.replace(/\D/g, '');
  if (!/^\d{7,15}$/.test(digits)) return null;
  // Local Nigerian format 0803... -> international 234803...
  const n = digits.startsWith('0') && digits.length === 11 ? '234' + digits.slice(1) : digits;
  return plus || n.length >= 10 ? n : null;
}

export function whatsappUrl(number: string | null, text: string): string {
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}
