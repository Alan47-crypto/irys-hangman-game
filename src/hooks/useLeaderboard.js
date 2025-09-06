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
  const [offset, setOffset] = useState(0);    // how many from the end we've loaded
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

  // ---- Strong reload: fetch enough pages in one pass to build a real Top-10 ----
  const reload = useCallback(async () => {
    const contract = makeContract();
    if (!contract) return;

    setLoading(true);
    setError(null);

    try {
      const count = Number(await contract.getScoresCount());
      setTotal(count);

      if (count === 0) {
        setRows([]);
        setOffset(0);
        setHasMore(false);
        return;
      }

      const MAX_EXTRA_PAGES = 6; // safety cap
      const acc = [];
      const seen = new Set(); // distinct players
      let nextOffset = 0;
      let pagesFetched = 0;

      while (nextOffset < count && pagesFetched < MAX_EXTRA_PAGES && seen.size < 10) {
        const remaining = count - nextOffset;
        const take = Math.min(pageSize, remaining);
        const start = Math.max(0, count - nextOffset - take);

        // fetch ascending slice, then flip to newest-first
        // eslint-disable-next-line no-await-in-loop
        const page = await contract.getScoresSlice(start, take);
        const pageNorm = (page || []).map(normalizeScore).reverse();

        for (const s of pageNorm) {
          acc.push(s);
          seen.add(String(s.player || '').toLowerCase());
        }

        nextOffset += take;
        pagesFetched += 1;

        if (seen.size >= 10) break;
      }

      setRows(acc);
      setOffset(nextOffset);
      setHasMore(nextOffset < count);
    } catch (e) {
      console.error('Leaderboard reload error:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [makeContract, pageSize]);

  // ---- “Load more” just fetches one more page and appends ----
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const contract = makeContract();
    if (!contract) return;

    setLoading(true);
    setError(null);

    try {
      const count = Number(await contract.getScoresCount());
      setTotal(count);

      if (offset >= count) {
        setHasMore(false);
        return;
      }

      const remaining = count - offset;
      const take = Math.min(pageSize, remaining);
      const start = Math.max(0, count - offset - take);

      const page = await contract.getScoresSlice(start, take);
      const pageNorm = (page || []).map(normalizeScore).reverse();

      setRows((prev) => [...prev, ...pageNorm]);
      const newOffset = offset + take;
      setOffset(newOffset);
      setHasMore(newOffset < count);
    } catch (e) {
      console.error('Leaderboard loadMore error:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [makeContract, pageSize, offset, loading, hasMore]);

  // Initial load & when provider changes
  useEffect(() => {
    reset();
    if (readProvider) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readProvider]);

  return { rows, total, loading, error, hasMore, loadMore, reload };
}
