/**
 * Normalise a phone number to international digits (no +) for a wa.me link, or null if invalid.
 * Nigerian numbers always end up as 234 + 10 digits, whatever form was saved:
 * 0803 123 4567, 803 123 4567, 234 803 123 4567, +234 803 123 4567, +234 (0) 803 123 4567, 00234803...
 * Numbers with another country code are kept as entered.
 */
export function toWhatsAppNumber(raw: string): string | null {
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  const explicitInternational = trimmed.startsWith('+') || digits.startsWith('00');
  if (digits.startsWith('00')) digits = digits.slice(2);

  const isNigerian =
    digits.startsWith('234') || (!explicitInternational && /^0?[789]\d{9}$/.test(digits));

  if (isNigerian) {
    const national = (digits.startsWith('234') ? digits.slice(3) : digits).replace(/^0/, '');
    return /^\d{10}$/.test(national) ? '234' + national : null;
  }

  return /^\d{8,15}$/.test(digits) && (explicitInternational || digits.length >= 10) ? digits : null;
}

/** Human-readable form of a normalised number, e.g. 2348031234567 -> +234 803 123 4567 */
export function formatWhatsAppNumber(number: string): string {
  if (number.startsWith('234') && number.length === 13) {
    return `+234 ${number.slice(3, 6)} ${number.slice(6, 9)} ${number.slice(9)}`;
  }
  return `+${number}`;
}

export function whatsappUrl(number: string | null, text: string): string {
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
  return text.trim() ? `${base}?text=${encodeURIComponent(text)}` : base;
}
