import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Faq, Lead, Product } from './types';

function useTable<T>(table: 'products' | 'faqs' | 'leads') {
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
  }, [refresh]);

  return { items, loading, error, refresh };
}

export const useProducts = () => useTable<Product>('products');
export const useFaqs = () => useTable<Faq>('faqs');
export const useLeads = () => useTable<Lead>('leads');
