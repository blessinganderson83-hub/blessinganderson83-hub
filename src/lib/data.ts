import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Faq, Lead, Order, Product } from './types';

function useTable<T>(table: 'products' | 'faqs' | 'leads' | 'orders') {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: true });
    if (err) {
      setError('Could not load data. Please try again.');
    } else {
      setItems((data as T[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [table]);

  useEffect(() => {
    refresh();

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = window.setInterval(refreshWhenVisible, 20000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refresh]);

  return { items, loading, error, refresh };
}

export const useProducts = () => useTable<Product>('products');
export const useFaqs = () => useTable<Faq>('faqs');
export const useLeads = () => useTable<Lead>('leads');
export const useOrders = () => useTable<Order>('orders');
