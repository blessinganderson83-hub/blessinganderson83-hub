import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProducts, useLeads } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { toWhatsAppNumber, whatsappUrl } from '@/lib/whatsapp';
import {
  Bot,
  Check,
  Copy,
  Eraser,
  Loader2,
  Package,
  Pencil,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import {
  generateSuggestions,
  findBestFaq,
  missingInfoTopics,
  CATEGORIES,
  type Category,
  type Suggestion,
} from '@/lib/replyEngine';
import { useSettings } from '@/lib/useSettings';
import type { Faq } from '@/lib/types';

export default function SmartReply() {
  const { items: products } = useProducts();
  const { items: leads } = useLeads();
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
  const [matchedFaq, setMatchedFaq] = useState<Faq | null>(null);
  const [missingTopics, setMissingTopics] = useState<string[]>([]);
  const [phoneMode, setPhoneMode] = useState<'lead' | 'manual'>('lead');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [waError, setWaError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('faqs').select('*').then(({ data }) => setFaqs(data ?? []));
  }, []);

  const leadParam = searchParams.get('lead') ?? '';
  useEffect(() => {
    if (leadParam) {
      setPhoneMode('lead');
      setSelectedLeadId(leadParam);
    }
  }, [leadParam]);

  // Preselect the first lead that has a usable WhatsApp number
  useEffect(() => {
    if (!selectedLeadId && leads.length > 0) {
      const first = leads.find((l) => toWhatsAppNumber(l.phone ?? ''));
      if (first) setSelectedLeadId(first.id);
    }
  }, [leads, selectedLeadId]);

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

  const selectedLead = leads.find((l) => l.id === selectedLeadId) ?? null;
  const phoneRaw = phoneMode === 'manual' ? manualPhone : selectedLead?.phone ?? '';
  const waNumber = useMemo(() => toWhatsAppNumber(phoneRaw), [phoneRaw]);

  const openWhatsApp = (replyText: string) => {
    if (!phoneRaw.trim()) {
      setWaError('Add the customer\u2019s phone number first — pick a lead or type a number below.');
      return;
    }
    if (!waNumber) {
      setWaError('That phone number does not look valid. Use a full number, e.g. 0803 123 4567.');
      return;
    }
    setWaError(null);
    window.open(whatsappUrl(waNumber, replyText), '_blank', 'noopener,noreferrer');
  };

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
      const text = message.toLowerCase();
      setMatchedFaq(findBestFaq(text, faqs));
      setMissingTopics(missingInfoTopics(message, faqs, settings));
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
    setMatchedFaq(null);
    setMissingTopics([]);
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
                <span key={p.id} className="inline-flex items-center gap-1.5">
                  <span className="rounded-full bg-white border border-[#128C7E]/25 px-2 py-0.5 font-medium text-[#128C7E]">
                    {p.name}
                  </span>
                  <Link
                    to={`/orders?product=${encodeURIComponent(p.name)}`}
                    className="font-medium text-[#128C7E] underline underline-offset-2"
                  >
                    Create order
                  </Link>
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

      {matchedFaq && !generating && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <Bot className="h-4 w-4 text-[#128C7E]" />
            Using your saved FAQ
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-800">{matchedFaq.question}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
            {matchedFaq.answer}
          </p>
          <Link
            to="/faqs"
            className="mt-2 inline-block text-xs font-medium text-[#128C7E] underline underline-offset-2"
          >
            Edit this in the FAQ Manager
          </Link>
        </div>
      )}

      {missingTopics.length > 0 && !generating && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Missing information
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Replies could not quote details for: {missingTopics.join('; ')}. Add them so future
            replies answer fully:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {missingTopics.map((t) => (
              <li key={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</li>
            ))}
          </ul>
          <div className="mt-2 flex gap-3 text-xs font-medium">
            <Link to="/faqs" className="text-amber-900 underline underline-offset-2">
              Add an FAQ
            </Link>
            <Link to="/settings" className="text-amber-900 underline underline-offset-2">
              Open Settings
            </Link>
          </div>
        </div>
      )}

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
                  <a
                    href={whatsappUrl(waNumber && phoneRaw.trim() ? waNumber : null, s.text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!phoneRaw.trim() || !waNumber) {
                        e.preventDefault();
                        openWhatsApp(s.text);
                      }
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1fb357]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Open WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Send via WhatsApp (you press send)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhoneMode('lead');
                  setWaError(null);
                }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  phoneMode === 'lead'
                    ? 'bg-[#128C7E] text-white shadow-sm'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Pick from Leads
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhoneMode('manual');
                  setWaError(null);
                }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  phoneMode === 'manual'
                    ? 'bg-[#128C7E] text-white shadow-sm'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Type a number
              </button>
            </div>
            {phoneMode === 'lead' ? (
              leads.length > 0 ? (
                <select
                  aria-label="Pick a customer lead"
                  className="input mt-3"
                  value={selectedLeadId}
                  onChange={(e) => {
                    setSelectedLeadId(e.target.value);
                    setWaError(null);
                  }}
                >
                  <option value="">Choose a customer…</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                      {l.phone ? ` — ${l.phone}` : ' (no number saved)'}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">
                  No leads yet.{' '}
                  <Link to="/leads" className="font-medium text-[#128C7E] underline underline-offset-2">
                    Add one in Leads
                  </Link>
                </p>
              )
            ) : (
              <input
                type="tel"
                inputMode="tel"
                aria-label="Customer phone number"
                className="input mt-3"
                placeholder="e.g. 0803 123 4567 or +234 803 123 4567"
                value={manualPhone}
                onChange={(e) => {
                  setManualPhone(e.target.value);
                  setWaError(null);
                }}
              />
            )}
            {waError && <p className="error-text mt-2">{waError}</p>}
            <p className="mt-2 text-xs text-neutral-400">
              WhatsApp opens with your reply pre-filled. You review it and press send yourself —
              nothing is sent automatically.
            </p>
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
