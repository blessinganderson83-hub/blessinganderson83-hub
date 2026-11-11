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

export interface BusinessSettings {
  businessName: string;
  greeting: string;
  closing: string;
  deliveryNote: string;
}
