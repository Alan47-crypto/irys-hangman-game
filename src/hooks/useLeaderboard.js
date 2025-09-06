// src/hooks/useLeaderboard.js
import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import LeaderboardAbi from '../lib/abi/Leaderboard.json';
import { CONTRACT_ADDRESS } from '../lib/contract';

/**
 * useLeaderboard(readProvider, pageSize?)
 * - readProvider: ethers Provider (JsonRpcProvider or BrowserProvider)
 * - pageSize: how many rows to fetch per page from getScoresSlice
 */
export function useLeaderboard(readProvider, pageSize = 25) {
  const [rows, setRows] = useState([]);       // normalized Score[]
  const [total, setTotal] = useState(0);      // total on-chain count
  const [offset, setOffset] = useState(0);    // next slice start (from newest end)
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const makeContract = useCallback(() => {
    if (!readProvider) return null;
    try {
      return new ethers.Contract(CONTRACT_ADDRESS, LeaderboardAbi, readProvider);
    } catch (e) {
      console.error('Failed to create read-only contract:', e);
      setError(e);
      return null;
    }
  }, [readProvider]);

  const normalizeScore = (s) => ({
    player: s.player,
    word: s.word,
    points: Number(s.points ?? 0),
    solveTime: Number(s.solveTime ?? 0),
    timestamp: Number(s.timestamp ?? 0),
  });

  const reset = useCallback(() => {
    setRows([]);
    setTotal(0);
    setOffset(0);
    setHasMore(false);
    setError(null);
  }, []);

  const loadPageOnce = useCallback(async () => {
    if (!readProvider) return;
    setLoading(true);
    setError(null);

    try {
      const contract = makeContract();
      if (!contract) throw new Error('No read provider available');

      // total rows
      const count = Number(await contract.getScoresCount());
      if (count !== total) setTotal(count);

      if (count === 0) {
        setRows([]);
        setHasMore(false);
        return;
      }

      // newest-first paging from the end of the array
      const remaining = count - offset;
      const take = Math.min(pageSize, remaining);
      const start = Math.max(0, count - offset - take);

      const page = await contract.getScoresSlice(start, take);
      const pageNorm = (page || []).map(normalizeScore);
      const pageNewestFirst = pageNorm.reverse();

      setRows((prev) => [...prev, ...pageNewestFirst]);
      const newOffset = offset + take;
      setOffset(newOffset);
      setHasMore(newOffset < count);
    } catch (e) {
      console.error('Leaderboard load error:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [readProvider, makeContract, offset, pageSize, total]);

  // 👇 Auto-prefetch until we have at least 10 distinct players (or 4 pages), so Top-10 fills in
  const prefetchUntilTop10 = useCallback(async () => {
    // avoid overlapping loads
    if (loading || !readProvider) return;

    // simple loop with caps
    const MAX_EXTRA_PAGES = 4; // safety
    let pagesFetched = 0;

    const getDistinctPlayers = (arr) => {
      const set = new Set();
      for (const s of arr) set.add(String(s.player || '').toLowerCase());
      return set.size;
    };

    // If we already have 10 unique players, stop
    if (getDistinctPlayers(rows) >= 10 || !hasMore) return;

    while (pagesFetched < MAX_EXTRA_PAGES) {
      // eslint-disable-next-line no-await-in-loop
      await loadPageOnce();
      pagesFetched += 1;

      if (getDistinctPlayers(rows) >= 10 || !hasMore) break;
    }
  }, [readProvider, rows, hasMore, loadPageOnce, loading]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      return loadPageOnce();
    }
  }, [loading, hasMore, loadPageOnce]);

  const reload = useCallback(() => {
    reset();
    // allow state to reset, then fetch first page and prefetch
    setTimeout(async () => {
      await loadPageOnce();
      await prefetchUntilTop10();
    }, 0);
  }, [reset, loadPageOnce, prefetchUntilTop10]);

  // initial + whenever provider changes
  useEffect(() => {
    reset();
    if (readProvider) {
      (async () => {
        await loadPageOnce();
        await prefetchUntilTop10();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readProvider]);

  return { rows, total, loading, error, hasMore, loadMore, reload };
}
