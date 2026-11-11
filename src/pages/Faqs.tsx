import { useState } from 'react';
import { useFaqs } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import type { Faq } from '@/lib/types';
import { HelpCircle, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';

interface FormState {
  question: string;
  answer: string;
  category: string;
}

const emptyForm: FormState = { question: '', answer: '', category: 'General' };
const CATEGORIES = ['General', 'Delivery', 'Payment', 'Pricing', 'Returns'];

export default function Faqs() {
  const { items, loading, error, refresh } = useFaqs();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (f: Faq) => {
    setForm({ question: f.question, answer: f.answer, category: f.category ?? 'General' });
    setEditingId(f.id);
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.question.trim()) e.question = 'Question is required.';
    if (!form.answer.trim()) e.answer = 'Answer is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
    };
    const { error: err } = editingId
      ? await supabase.from('faqs').update(payload).eq('id', editingId)
      : await supabase.from('faqs').insert({ ...payload, is_demo: false });
    setSaving(false);
    if (err) {
      setErrors({ question: 'Could not save. Please try again.' });
      return;
    }
    setShowForm(false);
    refresh();
  };

  const remove = async () => {
    if (!deleteId) return;
    await supabase.from('faqs').delete().eq('id', deleteId);
    setDeleteId(null);
    refresh();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">FAQ Manager</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Saved questions and answers the Smart Reply Generator can use.
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add FAQ
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-neutral-500">
          <HelpCircle className="h-8 w-8 text-neutral-300" />
          <p>No FAQs yet. Add common questions your customers ask.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((f) => (
            <div key={f.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {f.category || 'General'}
                  </span>
                  {f.is_demo && <span className="demo-badge ml-2">Demo data</span>}
                  <h3 className="mt-2 font-semibold text-neutral-900">{f.question}</h3>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="btn-secondary px-3 py-2" onClick={() => openEdit(f)} aria-label="Edit FAQ">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="btn-danger" onClick={() => setDeleteId(f.id)} aria-label="Delete FAQ">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
                {f.answer}
              </p>
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
              <h2 className="font-semibold text-neutral-900">
                {editingId ? 'Edit FAQ' : 'Add FAQ'}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4 p-4">
              <div>
                <label htmlFor="f-cat" className="label">Category</label>
                <select
                  id="f-cat"
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-q" className="label">Question</label>
                <input
                  id="f-q"
                  className="input"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="e.g. How long does delivery take?"
                />
                {errors.question && <p className="error-text">{errors.question}</p>}
              </div>
              <div>
                <label htmlFor="f-a" className="label">Answer</label>
                <textarea
                  id="f-a"
                  className="input min-h-[110px]"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="The reply to send customers who ask this"
                />
                {errors.answer && <p className="error-text">{errors.answer}</p>}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Save changes' : 'Add FAQ'}
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
            <h2 className="font-semibold text-neutral-900">Delete FAQ?</h2>
            <p className="mt-2 text-sm text-neutral-500">
              This permanently removes the question and its answer.
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
