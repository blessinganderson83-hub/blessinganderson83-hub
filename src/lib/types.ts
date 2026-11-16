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
