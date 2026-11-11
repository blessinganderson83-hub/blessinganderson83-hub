import { useState } from 'react';
import { useSettings } from '@/lib/useSettings';
import { Check, Loader2, Save, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useSettings();
  const [form, setForm] = useState(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.businessName.trim()) errs.businessName = 'Business name is required.';
    if (!form.greeting.trim()) errs.greeting = 'Greeting is required.';
    if (!form.closing.trim()) errs.closing = 'Closing line is required.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setSettings({
      businessName: form.businessName.trim(),
      greeting: form.greeting.trim(),
      closing: form.closing.trim(),
      deliveryNote: form.deliveryNote.trim(),
    });
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 300);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          These details are woven into every reply the Smart Reply Generator creates.
        </p>
      </div>

      <form onSubmit={save} className="card max-w-2xl space-y-5 p-6">
        <div>
          <label htmlFor="s-name" className="label">Business name</label>
          <input
            id="s-name"
            className="input"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            placeholder="e.g. Chidi Fabrics & More"
          />
          {errors.businessName && <p className="error-text">{errors.businessName}</p>}
        </div>
        <div>
          <label htmlFor="s-greet" className="label">Standard greeting</label>
          <textarea
            id="s-greet"
            className="input min-h-[70px]"
            value={form.greeting}
            onChange={(e) => setForm({ ...form, greeting: e.target.value })}
            placeholder="e.g. Hello! Thank you for contacting us."
          />
          {errors.greeting && <p className="error-text">{errors.greeting}</p>}
        </div>
        <div>
          <label htmlFor="s-close" className="label">Standard closing line</label>
          <textarea
            id="s-close"
            className="input min-h-[70px]"
            value={form.closing}
            onChange={(e) => setForm({ ...form, closing: e.target.value })}
            placeholder="e.g. Is there anything else we can help you with?"
          />
          {errors.closing && <p className="error-text">{errors.closing}</p>}
        </div>
        <div>
          <label htmlFor="s-delivery" className="label">Default delivery note</label>
          <textarea
            id="s-delivery"
            className="input min-h-[80px]"
            value={form.deliveryNote}
            onChange={(e) => setForm({ ...form, deliveryNote: e.target.value })}
            placeholder="Used when a customer asks about delivery or shipping"
          />
        </div>
        <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm font-medium text-green-700">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </form>

      <div className="card mt-6 max-w-2xl p-6">
        <div className="flex items-start gap-3">
          <SettingsIcon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" />
          <div className="text-sm text-neutral-600">
            <p className="font-semibold text-neutral-900">How ChatSales AI works</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Reply suggestions are generated on this device using your catalogue, FAQs and the settings above.</li>
              <li>You copy the reply and send it yourself in WhatsApp. Nothing is ever sent automatically.</li>
              <li>Your settings are stored privately in this browser.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
