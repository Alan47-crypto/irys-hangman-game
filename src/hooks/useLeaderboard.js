// src/hooks/useLeaderboard.js
import { useEffect, useState, useCallback } from 'react';
import { getContract } from '../lib/contract';

export function useLeaderboard(provider, pageSize = 25) {
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(null);

  const toMutableDesc = (readonlyArr) => {
    // Make a real mutable array, then reverse
    const arr = Array.from(readonlyArr);
    arr.reverse();
    return arr;
  };

  const loadInitial = useCallback(async () => {
    if (!provider) return;
    setLoading(true); setError(null);
    try {
      const c = getContract(provider);
      const count = Number(await c.getScoresCount());
      setTotal(count);
      const end = count;
      const start = Math.max(0, end - pageSize);
      const slice = await c.getScoresSlice(start, pageSize); // ascending (oldest->newest)
      setRows(toMutableDesc(slice));                          // newest-first (mutable)
      setOffset(start);
      setHasMore(start > 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [provider, pageSize]);

  const loadMore = useCallback(async () => {
    if (!provider || !hasMore || loading || offset === null) return;
    setLoading(true); setError(null);
    try {
      const c = getContract(provider);
      const end = offset;
      const start = Math.max(0, end - pageSize);
      const slice = await c.getScoresSlice(start, end - start); // ascending
      const more = toMutableDesc(slice);                        // newest-first
      setRows((prev) => [...prev, ...more]);
      setOffset(start);
      setHasMore(start > 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [provider, pageSize, hasMore, loading, offset]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  return { total, rows, loading, error, hasMore, loadMore, reload: loadInitial };
}
