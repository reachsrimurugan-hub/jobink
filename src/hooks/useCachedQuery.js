import { useState, useEffect, useCallback, useRef } from 'react';

// Global cache store
const queryCache = new Map();
// Global pending promises to handle deduplication
const pendingQueries = new Map();

/**
 * Custom query hook for deduplication, caching, retries, and debouncing.
 * 
 * @param {string|Array} queryKey Unique key representing the query
 * @param {Function} fetchFn Async fetching function
 * @param {Object} options Configuration options
 */
export const useCachedQuery = (queryKey, fetchFn, options = {}) => {
  const {
    staleTime = 60000, // 1 minute in ms
    retries = 3,
    retryDelay = 1000, // exponential backoff multiplier
    debounceMs = 0
  } = options;

  const cacheKey = typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey);

  const [data, setData] = useState(() => {
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      return cached.data;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep ref to avoid stale closure issues in async actions
  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const executeFetch = useCallback(async (attempt = 0) => {
    try {
      // 1. Deduplicate inflight requests
      if (pendingQueries.has(cacheKey)) {
        return await pendingQueries.get(cacheKey);
      }

      const promise = fetchFnRef.current();
      pendingQueries.set(cacheKey, promise);
      
      const result = await promise;
      pendingQueries.delete(cacheKey);

      // 2. Cache result
      queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (err) {
      pendingQueries.delete(cacheKey);
      
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return executeFetch(attempt + 1);
      }
      throw err;
    }
  }, [cacheKey, retries, retryDelay]);

  useEffect(() => {
    let active = true;
    let debounceTimer = null;

    const runQuery = async () => {
      // Check fresh cache
      const cached = queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < staleTime) {
        if (active) {
          setData(cached.data);
          setLoading(false);
          setError(null);
        }
        return;
      }

      if (active) setLoading(true);

      try {
        const result = await executeFetch();
        if (active) {
          setData(result);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err);
          setLoading(false);
        }
      }
    };

    if (debounceMs > 0) {
      debounceTimer = setTimeout(runQuery, debounceMs);
    } else {
      runQuery();
    }

    return () => {
      active = false;
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [cacheKey, staleTime, debounceMs, executeFetch]);

  const refetch = useCallback(async () => {
    queryCache.delete(cacheKey);
    setLoading(true);
    try {
      const result = await executeFetch();
      setData(result);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, [cacheKey, executeFetch]);

  return { data, loading, error, refetch };
};
