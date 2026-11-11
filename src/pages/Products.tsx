import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import {
  Check,
  CircleAlert,
  ImageOff,
  Loader2,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

interface FormState {
  name: string;
  price: string;
  description: string;
  stock: string;
  image_url: string;
}

const emptyForm: FormState = { name: '', price: '', description: '', stock: 'In Stock', image_url: '' };

const STOCK_OPTIONS = ['In Stock', 'Out of Stock'];
const MAX_IMAGE_BYTES = 300 * 1024; // keep small enough for the database row

export default function Products() {
  const { items, loading, error, refresh } = useProducts();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const showToast = (kind: 'success' | 'error', text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 3500);
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      price: String(p.price),
      description: p.description ?? '',
      stock: p.stock ?? 'In Stock',
      image_url: p.image_url ?? '',
    });
    setEditingId(p.id);
    setErrors({});
    setShowForm(true);
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((e) => ({ ...e, image_url: 'Please choose an image file (JPG, PNG, etc.).' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((e) => ({ ...e, image_url: 'Image is too large. Please choose one under 300 KB.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image_url: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = 'Product name is required.';
    const price = Number(form.price);
    if (!form.price.trim()) e.price = 'Price is required.';
    else if (Number.isNaN(price) || price <= 0) e.price = 'Enter a valid price in Naira (e.g. 15000).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      stock: form.stock,
      image_url: form.image_url.trim() || null,
    };
    const { error: err } = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert({ ...payload, is_demo: false });
    setSaving(false);
    if (err) {
      showToast('error', 'Could not save the product. Please try again.');
      return;
    }
    setShowForm(false);
    refresh();
    showToast(
      'success',
      editingId
        ? `"${payload.name}" was updated successfully.`
        : `"${payload.name}" was added to your catalogue.`
    );
  };

  const toggleStock = async (p: Product) => {
    const next = p.stock === 'Out of Stock' ? 'In Stock' : 'Out of Stock';
    const { error: err } = await supabase.from('products').update({ stock: next }).eq('id', p.id);
    if (err) {
      showToast('error', 'Could not update availability. Please try again.');
      return;
    }
    refresh();
    showToast('success', `"${p.name}" is now marked ${next.toLowerCase()}.`);
  };

  const remove = async () => {
    if (!deleteId) return;
    const target = items.find((p) => p.id === deleteId);
    const { error: err } = await supabase.from('products').delete().eq('id', deleteId);
    setDeleteId(null);
    if (err) {
      showToast('error', 'Could not delete the product. Please try again.');
      return;
    }
    refresh();
    showToast('success', `"${target?.name ?? 'Product'}" was deleted.`);
  };

  const naira = (n: number) =>
    '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 2 });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Product Catalogue</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage the products the Smart Reply Generator quotes from.
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      {toast && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            toast.kind === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
          role="status"
        >
          {toast.kind === 'success' ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <CircleAlert className="h-4 w-4 shrink-0" />
          )}
          {toast.text}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          className="input pl-10"
          placeholder="Search products by name or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-neutral-500">
          <Package className="h-8 w-8 text-neutral-300" />
          <p>No products yet. Add your first product to get started.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-neutral-500">
          <Search className="h-8 w-8 text-neutral-300" />
          <p>No products match "{search}". Try a different search.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <div key={p.id} className="card flex flex-col overflow-hidden">
              <div className="relative flex h-40 items-center justify-center bg-neutral-100">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <ImageOff className="h-8 w-8 text-neutral-300" />
                )}
                {p.is_demo && <span className="demo-badge absolute left-3 top-3">Demo data</span>}
                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                    p.stock === 'Out of Stock'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {p.stock === 'Out of Stock' ? 'Out of Stock' : 'In Stock'}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug text-neutral-900">{p.name}</h3>
                  <p className="shrink-0 font-bold text-[#128C7E]">{naira(p.price)}</p>
                </div>
                {p.description && (
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-neutral-500">
                    {p.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
                  <button
                    type="button"
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      p.stock === 'Out of Stock'
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                    onClick={() => toggleStock(p)}
                    title="Tap to change availability"
                  >
                    Mark {p.stock === 'Out of Stock' ? 'In Stock' : 'Out of Stock'}
                  </button>
                  <button
                    className="btn-secondary px-3 py-2"
                    onClick={() => navigate(`/reply?product=${encodeURIComponent(p.name)}`)}
                    aria-label={`Draft a reply about ${p.name}`}
                    title="Draft a reply about this product"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button className="btn-secondary px-3 py-2" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="btn-danger" onClick={() => setDeleteId(p.id)} aria-label={`Delete ${p.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-neutral-900/50 p-0 sm:items-center sm:p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="card w-full max-w-lg rounded-b-none sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-4">
              <h2 className="font-semibold text-neutral-900">
                {editingId ? 'Edit product' : 'Add product'}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4 p-4">
              <div>
                <label htmlFor="p-name" className="label">Product name</label>
                <input
                  id="p-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ankara Fabric (6 Yards)"
                />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="p-price" className="label">Price (₦)</label>
                <input
                  id="p-price"
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 15000"
                />
                {errors.price && <p className="error-text">{errors.price}</p>}
              </div>
              <div>
                <label htmlFor="p-desc" className="label">Description</label>
                <textarea
                  id="p-desc"
                  className="input min-h-[70px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description customers will recognise"
                />
              </div>
              <div>
                <label htmlFor="p-stock" className="label">Availability</label>
                <select
                  id="p-stock"
                  className="input"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                >
                  {STOCK_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="p-img" className="label">Product image (optional)</label>
                {form.image_url ? (
                  <div className="relative overflow-hidden rounded-lg border border-neutral-200">
                    <img src={form.image_url} alt="Product preview" className="h-36 w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
                      onClick={() => setForm({ ...form, image_url: '' })}
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4 text-neutral-600" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="p-img"
                    className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-6 text-center transition hover:border-[#128C7E] hover:bg-[#128C7E]/5"
                  >
                    <Plus className="h-5 w-5 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600">Upload an image</span>
                    <span className="text-xs text-neutral-400">JPG or PNG, up to 300 KB</span>
                  </label>
                )}
                <input
                  id="p-img"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => pickImage(e.target.files?.[0])}
                />
                {errors.image_url && <p className="error-text">{errors.image_url}</p>}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Product
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
            <h2 className="font-semibold text-neutral-900">Delete product?</h2>
            <p className="mt-2 text-sm text-neutral-500">
              This permanently removes "
              {items.find((p) => p.id === deleteId)?.name ?? 'this product'}
              " from your catalogue.
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
