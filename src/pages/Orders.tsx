import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLeads, useOrders, useProducts } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/lib/types';
import { CheckCircle2, ClipboardList, Loader2, Pencil, Plus, Trash2, X, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS: { value: OrderStatus; label: string; classes: string }[] = [
  { value: 'pending', label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
  { value: 'confirmed', label: 'Confirmed', classes: 'bg-blue-100 text-blue-700' },
  { value: 'delivered', label: 'Delivered', classes: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', classes: 'bg-neutral-200 text-neutral-600' },
];

const statusStyles = (s: OrderStatus) =>
  STATUS_OPTIONS.find((o) => o.value === s)?.classes ?? 'bg-neutral-200 text-neutral-600';

const naira = (n: number) =>
  '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 });

interface OrderForm {
  customer_name: string;
  phone: string;
  product_id: string;
  quantity: string;
  notes: string;
  lead_id: string | null;
}

const emptyForm = (): OrderForm => ({
  customer_name: '',
  phone: '',
  product_id: '',
  quantity: '1',
  notes: '',
  lead_id: null,
});

export default function Orders() {
  const { items, loading, error, refresh } = useOrders();
  const { items: products } = useProducts();
  const { items: leads } = useLeads();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const productParam = searchParams.get('product');
  const leadParam = searchParams.get('lead');

  useEffect(() => {
    if (!productParam && !leadParam) return;
    if (productParam && products.length === 0) return;
    if (leadParam && leads.length === 0) return;
    const product = productParam
      ? products.find((p) => p.name.toLowerCase() === productParam.toLowerCase())
      : undefined;
    const lead = leadParam ? leads.find((l) => l.id === leadParam) : undefined;
    setEditing(null);
    setForm({
      ...emptyForm(),
      product_id: product?.id ?? '',
      customer_name: lead?.name ?? '',
      phone: lead?.phone ?? '',
      lead_id: lead?.id ?? null,
      notes: lead ? `Enquiry: ${lead.message}` : '',
    });
    setErrors({});
    setShowForm(true);
    setSearchParams({}, { replace: true });
  }, [productParam, leadParam, products, leads, setSearchParams]);

  const selectedProduct = products.find((p) => p.id === form.product_id);
  const qty = Math.max(1, parseInt(form.quantity, 10) || 0);
  const total = selectedProduct ? selectedProduct.price * qty : 0;

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (o: Order) => {
    setEditing(o);
    setForm({
      customer_name: o.customer_name,
      phone: o.phone ?? '',
      product_id: o.product_id ?? '',
      quantity: String(o.quantity),
      notes: o.notes ?? '',
      lead_id: o.lead_id,
    });
    setErrors({});
    setShowForm(true);
  };

  const save = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!form.customer_name.trim()) e.customer_name = 'Customer name is required.';
    if (form.phone.trim() && !/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim()))
      e.phone = 'Enter a valid phone number.';
    if (!selectedProduct) e.product_id = 'Choose a product from your catalogue.';
    const qtyNum = Number(form.quantity);
    if (!Number.isInteger(qtyNum) || qtyNum < 1) e.quantity = 'Quantity must be a whole number, 1 or more.';
    setErrors(e);
    if (Object.keys(e).length > 0 || !selectedProduct) return;

    const payload = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim() || null,
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      unit_price: selectedProduct.price,
      quantity: qtyNum,
      total: selectedProduct.price * qtyNum,
      notes: form.notes.trim() || null,
      lead_id: form.lead_id,
    };

    setSaving(true);
    const { error: err } = editing
      ? await supabase.from('orders').update(payload).eq('id', editing.id)
      : await supabase.from('orders').insert({ ...payload, status: 'pending', is_demo: false });
    setSaving(false);
    if (err) {
      setToast({ type: 'error', text: 'Could not save the order. Please try again.' });
      return;
    }
    setToast({ type: 'success', text: editing ? 'Order updated.' : 'Order created.' });
    setShowForm(false);
    refresh();
  };

  const setStatus = async (o: Order, status: OrderStatus) => {
    if (o.status === status) return;
    const { error: err } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', o.id);
    if (err) {
      setToast({ type: 'error', text: 'Could not update status. Please try again.' });
      return;
    }
    setToast({ type: 'success', text: `Order marked ${status}.` });
    refresh();
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error: err } = await supabase.from('orders').delete().eq('id', deleteId);
    setDeleteId(null);
    if (err) {
      setToast({ type: 'error', text: 'Could not delete the order. Please try again.' });
      return;
    }
    setToast({ type: 'success', text: 'Order deleted.' });
    refresh();
  };

  const visible = filter === 'all' ? items : items.filter((o) => o.status === filter);
  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter((o) => o.status === 'pending').length,
      confirmed: items.filter((o) => o.status === 'confirmed').length,
      delivered: items.filter((o) => o.status === 'delivered').length,
      cancelled: items.filter((o) => o.status === 'cancelled').length,
    }),
    [items],
  );
  const deleteTarget = items.find((o) => o.id === deleteId);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Record what each customer bought and track it through to delivery.
          </p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus className="h-4 w-4" /> New order
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.text}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'pending', 'confirmed', 'delivered', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f
                ? 'bg-[#128C7E] text-white shadow-sm'
                : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
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
          <ClipboardList className="h-8 w-8 text-neutral-300" />
          <p>No orders in this view yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-neutral-900">{o.customer_name}</p>
                    {o.is_demo && <span className="demo-badge">Demo data</span>}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles(o.status)}`}>
                      {STATUS_OPTIONS.find((s) => s.value === o.status)?.label}
                    </span>
                  </div>
                  {o.phone && <p className="text-sm text-neutral-500">{o.phone}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="btn-secondary" onClick={() => openEdit(o)} aria-label={`Edit order for ${o.customer_name}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="btn-danger" onClick={() => setDeleteId(o.id)} aria-label={`Delete order for ${o.customer_name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-neutral-700">
                    {o.quantity} × {o.product_name}
                  </span>
                  <span className="font-semibold text-neutral-900">{naira(o.total)}</span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {naira(o.unit_price)} each
                  {!o.product_id && ' · Product no longer in catalogue'}
                </p>
              </div>

              {o.notes && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">{o.notes}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStatus(o, s.value)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      o.status === s.value
                        ? s.classes + ' ring-2 ring-offset-1 ring-neutral-300'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {s.label}
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
            className="card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-b-none sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-4">
              <h2 className="font-semibold text-neutral-900">{editing ? 'Edit order' : 'New order'}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4 p-4">
              <div>
                <label htmlFor="o-name" className="label">Customer name</label>
                <input
                  id="o-name"
                  className="input"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="e.g. Chinwe Eze"
                />
                {errors.customer_name && <p className="error-text">{errors.customer_name}</p>}
              </div>
              <div>
                <label htmlFor="o-phone" className="label">Phone / WhatsApp number (optional)</label>
                <input
                  id="o-phone"
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 0803 123 4567"
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="o-product" className="label">Product</label>
                <select
                  id="o-product"
                  className="input"
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({naira(p.price)})
                    </option>
                  ))}
                </select>
                {products.length === 0 && (
                  <p className="mt-1 text-xs text-neutral-500">Add products in the Product Catalogue first.</p>
                )}
                {errors.product_id && <p className="error-text">{errors.product_id}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="o-qty" className="label">Quantity</label>
                  <input
                    id="o-qty"
                    type="number"
                    min={1}
                    step={1}
                    className="input"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                  {errors.quantity && <p className="error-text">{errors.quantity}</p>}
                </div>
                <div>
                  <span className="label">Total</span>
                  <div className="input flex items-center bg-neutral-50 font-semibold text-neutral-900">
                    {selectedProduct ? naira(total) : '—'}
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="o-notes" className="label">Notes (optional)</label>
                <textarea
                  id="o-notes"
                  className="input min-h-[80px]"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Delivery address, payment status, colour or size"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? 'Save changes' : 'Create order'}
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
            <h2 className="font-semibold text-neutral-900">Delete order?</h2>
            <p className="mt-2 text-sm text-neutral-500">
              This permanently removes the order for {deleteTarget?.customer_name ?? 'this customer'}.
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
