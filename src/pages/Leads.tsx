import { useState } from 'react';
import { useLeads } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import type { Lead, LeadStatus } from '@/lib/types';
import { Inbox, Loader2, Plus, Trash2, User, X } from 'lucide-react';

const STATUS_OPTIONS: { value: LeadStatus; label: string; classes: string }[] = [
  { value: 'new', label: 'New', classes: 'bg-blue-100 text-blue-700' },
  { value: 'replied', label: 'Replied', classes: 'bg-amber-100 text-amber-700' },
  { value: 'won', label: 'Won', classes: 'bg-green-100 text-green-700' },
  { value: 'closed', label: 'Closed', classes: 'bg-neutral-200 text-neutral-600' },
];

const statusStyles = (s: LeadStatus) =>
  STATUS_OPTIONS.find((o) => o.value === s)?.classes ?? 'bg-neutral-200 text-neutral-600';

export default function Leads() {
  const { items, loading, error, refresh } = useLeads();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Customer name is required.';
    if (!form.message.trim()) e.message = 'Enquiry message is required.';
    if (form.phone.trim() && !/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim()))
      e.phone = 'Enter a valid phone number.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    const { error: err } = await supabase.from('leads').insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
      status: 'new',
      is_demo: false,
    });
    setSaving(false);
    if (err) {
      setErrors({ name: 'Could not save. Please try again.' });
      return;
    }
    setForm({ name: '', phone: '', message: '' });
    setShowForm(false);
    refresh();
  };

  const setStatus = async (lead: Lead, status: LeadStatus) => {
    await supabase.from('leads').update({ status }).eq('id', lead.id);
    refresh();
  };

  const remove = async () => {
    if (!deleteId) return;
    await supabase.from('leads').delete().eq('id', deleteId);
    setDeleteId(null);
    refresh();
  };

  const visible = filter === 'all' ? items : items.filter((l) => l.status === filter);
  const counts = {
    all: items.length,
    new: items.filter((l) => l.status === 'new').length,
    replied: items.filter((l) => l.status === 'replied').length,
    won: items.filter((l) => l.status === 'won').length,
    closed: items.filter((l) => l.status === 'closed').length,
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Customer Leads</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Track enquiries and keep every customer conversation moving.
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ name: '', phone: '', message: '' }); setErrors({}); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> Add lead
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'new', 'replied', 'won', 'closed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f
                ? 'bg-[#128C7E] text-white shadow-sm'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-neutral-500">
          <Inbox className="h-8 w-8 text-neutral-300" />
          <p>No leads in this view yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((l) => (
            <div key={l.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#128C7E]/10">
                  <User className="h-5 w-5 text-[#128C7E]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-neutral-900">{l.name}</p>
                    {l.is_demo && <span className="demo-badge">Demo data</span>}
                  </div>
                  {l.phone && <p className="text-sm text-neutral-500">{l.phone}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="btn-danger" onClick={() => setDeleteId(l.id)} aria-label={`Delete lead ${l.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
                {l.message}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setStatus(l, o.value)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      l.status === o.value
                        ? o.classes + ' ring-2 ring-offset-1 ring-neutral-300'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-0 sm:items-center sm:p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="card w-full max-w-lg rounded-b-none sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-4">
              <h2 className="font-semibold text-neutral-900">Add lead</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <XIcon />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4 p-4">
              <div>
                <label htmlFor="l-name" className="label">Customer name</label>
                <input
                  id="l-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Chidinma Okafor"
                />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="l-phone" className="label">Phone / WhatsApp number</label>
                <input
                  id="l-phone"
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 0803 123 4567"
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="l-msg" className="label">Enquiry</label>
                <textarea
                  id="l-msg"
                  className="input min-h-[90px]"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="What did the customer ask?"
                />
                {errors.message && <p className="error-text">{errors.message}</p>}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
          onClick={() => setDeleteId(null)}
        >
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-neutral-900">Delete lead?</h2>
            <p className="mt-2 text-sm text-neutral-500">
              This permanently removes the lead and its enquiry.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={remove}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function XIcon() {
  return <X className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />;
}
