export interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: string | null;
  image_url: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_demo: boolean;
  created_at: string;
}

export type LeadStatus = 'new' | 'replied' | 'won' | 'closed';

/**
 * Stored values stay as-is so existing records and the database constraint are untouched;
 * only the labels shown to the user differ.
 */
export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; badge: string; bar: string }
> = {
  new: { label: 'New', badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500' },
  replied: { label: 'Interested', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  won: { label: 'Converted', badge: 'bg-green-100 text-green-700', bar: 'bg-green-600' },
  closed: { label: 'Lost', badge: 'bg-neutral-200 text-neutral-600', bar: 'bg-neutral-400' },
};

export const LEAD_STATUS_ORDER: LeadStatus[] = ['new', 'replied', 'won', 'closed'];

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  message: string;
  status: LeadStatus;
  is_demo: boolean;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customer_name: string;
  phone: string | null;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  total: number;
  status: OrderStatus;
  lead_id: string | null;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  businessName: string;
  greeting: string;
  closing: string;
  deliveryNote: string;
}
