import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProducts } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import {
  Bot,
  Check,
  Copy,
  Eraser,
  Loader2,
  Package,
  Pencil,
  Sparkles,
} from 'lucide-react';
import {
  generateSuggestions,
  CATEGORIES,
  type Category,
  type Suggestion,
} from '@/lib/replyEngine';
import { useSettings } from '@/lib/useSettings';
import type { Faq } from '@/lib/types';

export default function SmartReply() {
  const { items: products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const productParam = searchParams.get('product') ?? '';
  const [settings] = useSettings();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [message, setMessage] = useState(productParam ? `Hello, I'm interested in the ${productParam}. ` : '');
  const [category, setCategory] = useState<Category>('Auto-detect');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('faqs').select('*').then(({ data }) => setFaqs(data ?? []));
  }, []);

  // Products from the catalogue whose names appear in the current message
  const quotedProducts = useMemo(() => {
    const text = message.toLowerCase();
    if (!text.trim()) return [];
    return products.filter((p) =>
      p.name
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .some((w) => w.length > 2 && text.includes(w))
    );
  }, [message, products]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please type or paste the customer message first.');
      return;
    }
    setError(null);
    setGenerating(true);
    setEditIndex(null);
    // Brief delay so the loading state is visible; the engine is local and fast
    setTimeout(() => {
      setSuggestions(generateSuggestions(message, { products, faqs, settings }, category));
      setGenerating(false);
    }, 500);
  };

  const handleClear = () => {
    setMessage('');
    setSuggestions([]);
    setEditIndex(null);
    setError(null);
    setGenerating(false);
    if (productParam) setSearchParams({}, { replace: true });
  };

  const copy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const updateSuggestion = (index: number, text: string) => {
    const next = [...suggestions];
    next[index] = { ...next[index], text };
    setSuggestions(next);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Smart Reply Generator</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Paste a customer enquiry, choose a response category, and get ready-to-send replies built
          from your catalogue, FAQ library and settings.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="card p-5">
        <label htmlFor="enquiry" className="label">
          Customer message
        </label>
        <textarea
          id="enquiry"
          className="input min-h-[110px] resize-y"
          placeholder="e.g. Hello, how much is the Ankara fabric? Do you deliver to Abuja?"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (error) setError(null);
          }}
        />
        {error && <p className="error-text">{error}</p>}

        <div className="mt-3 rounded-lg bg-[#128C7E]/5 border border-[#128C7E]/15 px-3.5 py-2.5">
          {quotedProducts.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-600">
              <Package className="h-3.5 w-3.5 shrink-0 text-[#128C7E]" />
              <span className="font-medium">Quoting from your catalogue:</span>
              {quotedProducts.map((p) => (
                <span
                  key={p.id}
                  className="rounded-full bg-white border border-[#128C7E]/25 px-2 py-0.5 font-medium text-[#128C7E]"
                >
                  {p.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Package className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span>
                Mention a product from your{' '}
                <Link to="/products" className="font-medium text-[#128C7E] underline underline-offset-2">
                  Product Catalogue
                </Link>{' '}
                and replies will quote its exact price and availability.
              </span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <span className="label">Response category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  category === c
                    ? 'bg-[#128C7E] text-white shadow-sm'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {c === 'Auto-detect' ? 'Auto-detect' : c}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {category === 'Auto-detect'
              ? 'We read the message and pick the best replies for you.'
              : `Replies will be written for a ${category.toLowerCase()}.`}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="btn-primary"
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Reply
              </>
            )}
          </button>
          <button type="button" className="btn-secondary" onClick={handleClear}>
            <Eraser className="h-4 w-4" />
            Clear
          </button>
        </div>
      </form>

      {generating && (
        <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white p-10 text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin text-[#128C7E]" />
          <span className="text-sm font-medium">Writing your replies…</span>
        </div>
      )}

      {!generating && suggestions.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              <Bot className="h-4 w-4 text-[#128C7E]" />
              {suggestions.length} suggested {suggestions.length === 1 ? 'reply' : 'replies'}
            </h2>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((s, i) => (
              <div key={i} className="card flex flex-col p-5">
                <span className="mb-3 self-start rounded-full bg-[#128C7E]/10 px-2.5 py-1 text-xs font-semibold text-[#128C7E]">
                  {s.label}
                </span>
                {editIndex === i ? (
                  <textarea
                    className="input min-h-[150px] flex-1 text-sm"
                    value={s.text}
                    autoFocus
                    onChange={(e) => updateSuggestion(i, e.target.value)}
                  />
                ) : (
                  <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                    {s.text}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                  <button
                    type="button"
                    className="btn-primary flex-1 px-3 py-2 text-xs"
                    onClick={() => copy(s.text, i)}
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy reply
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-xs"
                    onClick={() => setEditIndex(editIndex === i ? null : i)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {editIndex === i ? 'Done' : 'Edit'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-400">
            Replies are generated on this device. You copy and send them yourself in WhatsApp —
            nothing is sent automatically.
          </p>
        </div>
      )}
    </div>
  );
}
