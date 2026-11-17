import { useEffect, useState } from 'react';
import { Check, Copy, MessageCircle, RotateCcw, X } from 'lucide-react';
import { formatWhatsAppNumber, toWhatsAppNumber, whatsappUrl } from '@/lib/whatsapp';
import type { Lead } from '@/lib/types';

export function suggestedFollowUp(lead: Lead): string {
  const firstName = lead.name.trim().split(/\s+/)[0] || 'there';
  return `Hello ${firstName}, this is a follow-up on your enquiry. Do you still need help, or have any questions I can answer?`;
}

function followUpTemplates(lead: Lead): { label: string; text: string }[] {
  const firstName = lead.name.trim().split(/\s+/)[0] || 'there';
  return [
    { label: 'Check in', text: suggestedFollowUp(lead) },
    {
      label: 'Ready to order?',
      text: `Hello ${firstName}, just checking if you are ready to place your order. I can confirm the price and delivery details for you right away.`,
    },
    {
      label: 'Thank you',
      text: `Hello ${firstName}, thank you for your interest. Please let me know if there is anything else I can help you with.`,
    },
    { label: 'Blank', text: '' },
  ];
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  }
}

export default function WhatsAppFollowUp({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const number = toWhatsAppNumber(lead.phone ?? '');
  const [message, setMessage] = useState(() => suggestedFollowUp(lead));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    if (await copyText(message)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wa-title"
        className="card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-b-none sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 p-4">
          <div className="min-w-0">
            <h2 id="wa-title" className="font-semibold text-neutral-900">
              WhatsApp follow-up
            </h2>
            <p className="truncate text-sm text-neutral-500">
              {lead.name}
              {number && ` · ${formatWhatsAppNumber(number)}`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 p-1">
            <X className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="wa-message" className="label mb-0">
                Message (optional)
              </label>
              <button
                type="button"
                onClick={() => setMessage(suggestedFollowUp(lead))}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#128C7E]"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
            <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label="Message templates">
              {followUpTemplates(lead).map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setMessage(t.text)}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              id="wa-message"
              className="input min-h-[130px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave empty to open the chat without a message"
            />
            <p className="mt-1.5 text-xs text-neutral-500">
              Edit or copy the message first. WhatsApp opens with it ready, and you press send yourself.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary justify-center" onClick={copy}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy message'}
            </button>
            <a
              href={whatsappUrl(number, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary justify-center"
              onClick={onClose}
            >
              <MessageCircle className="h-4 w-4" /> Open WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
