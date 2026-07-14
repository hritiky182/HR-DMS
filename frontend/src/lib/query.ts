import { useState, useEffect } from "react";

type Listener = () => void;

class QueryCacheManager {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  invalidate() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error("Error in query listener:", e);
      }
    });
  }
}

export const queryCacheManager = new QueryCacheManager();

export function useQuery<T>({
  queryKey,
  queryFn,
}: {
  queryKey: any[];
  queryFn: () => Promise<T>;
}) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = async (isMounted: { current: boolean }) => {
    try {
      const result = await queryFn();
      if (isMounted.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const isMounted = { current: true };
    setIsLoading(true);
    fetchData(isMounted);

    const unsubscribe = queryCacheManager.subscribe(() => {
      fetchData(isMounted);
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [JSON.stringify(queryKey)]);

  return { data, isLoading, error };
}

export function useQueryClient() {
  return {
    invalidateQueries: () => {
      queryCacheManager.invalidate();
    },
  };
}
