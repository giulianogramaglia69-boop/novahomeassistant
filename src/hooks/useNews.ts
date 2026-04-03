import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export function useNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('news-feed');
      if (fnError) throw new Error(fnError.message);
      setItems(data?.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    // Refresh every 10 minutes
    const interval = setInterval(fetchNews, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return { items, loading, error, refresh: fetchNews };
}
