import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useLeads, useFaqs, useOrders } from '@/lib/data';
import { toWhatsAppNumber } from '@/lib/whatsapp';
import { LEAD_STATUS_META, LEAD_STATUS_ORDER } from '@/lib/types';
import type { Lead } from '@/lib/types';
import WhatsAppFollowUp from '@/components/WhatsAppFollowUp';
import {
  ArrowRight,
  HelpCircle,
  Inbox,
  Loader2,
  MessageCircle,
  Package,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

export default function Home() {
  const products = useProducts();
  const faqs = useFaqs();
  const leads = useLeads();
  const orders = useOrders();
  const [includeDemo, setIncludeDemo] = useState(false);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);

  const loading = products.loading || faqs.loading || leads.loading || orders.loading;
  const error = products.error || faqs.error || leads.error || orders.error;

  const scope = <T extends { is_demo: boolean }>(rows: T[]) =>
    includeDemo ? rows : rows.filter((r) => !r.is_demo);

  const leadRows = scope(leads.items);
  const productRows = scope(products.items);
  const faqRows = scope(faqs.items);
  const orderRows = scope(orders.items);

  const demoHidden = includeDemo
    ? 0
    : [leads.items, products.items, faqs.items, orders.items].reduce(
        (sum, rows) => sum + rows.filter((r) => r.is_demo).length,
        0,
      );

  const totalLeads = leadRows.length;
  const countByStatus = Object.fromEntries(
    LEAD_STATUS_ORDER.map((s) => [s, leadRows.filter((l) => l.status === s).length]),
  ) as Record<Lead['status'], number>;

  const recentLeads = [...leadRows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const addedThisWeek = leadRows.filter(
    (l) => Date.now() - new Date(l.created_at).getTime() <= 7 * DAY_MS,
  ).length;
  const withoutNumber = leadRows.filter((l) => !toWhatsAppNumber(l.phone ?? '')).length;
  const conversionRate = totalLeads > 0 ? Math.round((countByStatus.won / totalLeads) * 100) : 0;

  const activeOrders = orderRows.filter((o) => o.status !== 'cancelled');
  const orderValue = activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingOrders = orderRows.filter((o) => o.status === 'pending').length;

  const show = (n: number) => (loading ? '–' : n);

  const summaries = [
    {
      label: 'Conversion rate',
      value: totalLeads > 0 ? `${conversionRate}%` : 'No leads yet',
      hint: `${countByStatus.won} of ${totalLeads} leads converted`,
    },
    {
      label: 'Waiting for a first reply',
      value: String(countByStatus.new),
      hint: countByStatus.new === 1 ? 'new lead' : 'new leads',
    },
    {
      label: 'Added in the last 7 days',
      value: String(addedThisWeek),
      hint: addedThisWeek === 1 ? 'lead' : 'leads',
    },
    {
      label: 'No usable WhatsApp number',
      value: String(withoutNumber),
      hint: withoutNumber === 1 ? 'lead needs a phone number' : 'leads need a phone number',
    },
    {
      label: 'Pending orders',
      value: String(pendingOrders),
      hint: `${orderRows.length} order${orderRows.length === 1 ? '' : 's'} in total`,
    },
    {
      label: 'Order value',
      value: naira(orderValue),
      hint: 'excluding cancelled orders',
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Sales Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Live numbers from your saved leads, products and orders.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={includeDemo}
            onChange={(e) => setIncludeDemo(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 accent-[#128C7E]"
          />
          Include demo data
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {demoHidden > 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          {demoHidden} demo {demoHidden === 1 ? 'record is' : 'records are'} hidden so the numbers
          below only reflect your real data.
        </p>
      )}

      <section aria-labelledby="leads-heading">
        <h2 id="leads-heading" className="sr-only">
          Leads overview
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Link
            to="/leads"
            className="card col-span-2 flex items-center gap-4 p-4 transition hover:shadow-md lg:col-span-1"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#128C7E]/10">
              <Users className="h-5 w-5 text-[#128C7E]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{show(totalLeads)}</p>
              <p className="text-sm text-neutral-500">Total leads</p>
            </div>
          </Link>
          {LEAD_STATUS_ORDER.map((s) => (
            <Link key={s} to="/leads" className="card p-4 transition hover:shadow-md">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEAD_STATUS_META[s].badge}`}
              >
                {LEAD_STATUS_META[s].label}
              </span>
              <p className="mt-2 text-2xl font-bold text-neutral-900">{show(countByStatus[s])}</p>
            </Link>
          ))}
        </div>

        {totalLeads > 0 && (
          <div className="card mt-3 p-4">
            <p className="mb-2 text-xs font-medium text-neutral-500">Lead pipeline</p>
            <div
              className="flex h-2.5 overflow-hidden rounded-full bg-neutral-100"
              role="img"
              aria-label={LEAD_STATUS_ORDER.map(
                (s) => `${LEAD_STATUS_META[s].label}: ${countByStatus[s]}`,
              ).join(', ')}
            >
              {LEAD_STATUS_ORDER.map((s) =>
                countByStatus[s] > 0 ? (
                  <div
                    key={s}
                    className={LEAD_STATUS_META[s].bar}
                    style={{ width: `${(countByStatus[s] / totalLeads) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
          </div>
        )}
      </section>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Products in catalogue', value: productRows.length, icon: Package, to: '/products' },
          { label: 'FAQs', value: faqRows.length, icon: HelpCircle, to: '/faqs' },
          { label: 'Orders', value: orderRows.length, icon: ShoppingBag, to: '/orders' },
        ].map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="card flex items-center gap-4 p-4 transition hover:shadow-md"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#128C7E]/10">
              <s.icon className="h-5 w-5 text-[#128C7E]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{show(s.value)}</p>
              <p className="text-sm text-neutral-500">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <section className="card lg:col-span-3" aria-labelledby="recent-heading">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <h2 id="recent-heading" className="font-semibold text-neutral-900">
              Recent leads
            </h2>
            <Link to="/leads" className="inline-flex items-center gap-1 text-sm font-medium text-[#128C7E]">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-10 text-neutral-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-neutral-500">
              <Inbox className="h-7 w-7 text-neutral-300" />
              <p>No leads yet. Add your first customer enquiry on the Leads page.</p>
              <Link to="/leads" className="btn-secondary mt-1">
                Go to Leads
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recentLeads.map((l) => {
                const canMessage = Boolean(toWhatsAppNumber(l.phone ?? ''));
                return (
                  <li key={l.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-neutral-900">{l.name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEAD_STATUS_META[l.status].badge}`}
                        >
                          {LEAD_STATUS_META[l.status].label}
                        </span>
                        {l.is_demo && <span className="demo-badge">Demo data</span>}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-neutral-500">{l.message}</p>
                      <p className="mt-1 text-xs text-neutral-400">{timeAgo(l.created_at)}</p>
                    </div>
                    <button
                      className="btn-secondary shrink-0 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => setFollowUpLead(l)}
                      disabled={!canMessage}
                      title={canMessage ? 'WhatsApp follow-up' : 'No valid phone number saved'}
                      aria-label={
                        canMessage
                          ? `WhatsApp follow-up with ${l.name}`
                          : `No valid phone number saved for ${l.name}`
                      }
                    >
                      <MessageCircle className="h-4 w-4 text-[#25D366]" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-4 lg:col-span-2" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="font-semibold text-neutral-900">
            Summary
          </h2>
          <dl className="mt-3 divide-y divide-neutral-100">
            {summaries.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <dt className="text-sm text-neutral-600">{s.label}</dt>
                  <dd className="text-xs text-neutral-400">{s.hint}</dd>
                </div>
                <p className="shrink-0 text-base font-bold text-neutral-900">{loading ? '–' : s.value}</p>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="card mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#128C7E]/10">
            <Sparkles className="h-5 w-5 text-[#128C7E]" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">Generate a smart reply</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Paste a customer enquiry and get ready-to-send replies quoting your prices, stock and
              FAQs.
            </p>
          </div>
        </div>
        <Link to="/reply" className="btn-primary shrink-0 self-start sm:self-center">
          Open Smart Reply <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {followUpLead && (
        <WhatsAppFollowUp lead={followUpLead} onClose={() => setFollowUpLead(null)} />
      )}
    </div>
  );
}
