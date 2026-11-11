import { useEffect, useState } from 'react';
import type { BusinessSettings } from './types';

const KEY = 'chatsales-settings';

const defaults: BusinessSettings = {
  businessName: 'My Business',
  greeting: 'Hello! Thank you for contacting us.',
  closing: 'Is there anything else we can help you with?',
  deliveryNote:
    'We deliver nationwide. Lagos delivery takes 1-2 working days; other states 3-5 working days.',
};

export function loadSettings(): BusinessSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    // corrupted or missing storage — fall back to defaults
  }
  return { ...defaults };
}

export function useSettings(): [
  BusinessSettings,
  (s: BusinessSettings) => void,
] {
  const [settings, setSettings] = useState<BusinessSettings>(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // storage unavailable (private mode) — settings just won't persist
    }
  }, [settings]);

  return [settings, setSettings];
}
