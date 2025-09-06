// src/hooks/useLeaderboard.js
import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import LeaderboardAbi from '../lib/abi/Leaderboard.json';
import { CONTRACT_ADDRESS } from '../lib/contract';

/**
 * useLeaderboard(readProvider, pageSize?)
 * - readProvider: ethers.Provider (JsonRpcProvider or BrowserProvider)
 * - pageSize: how many rows to fetch per page from getScoresSlice
 */
export function useLeaderboard(readProvider, pageSize = 25) {
  const [rows, setRows] = useState([]);       // normalized Score[]
  const [total, setTotal] = useState(0);      // total on-chain count
  const [offset, setOffset] = useState(0);    // next slice start
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const makeContract = useCallback(async () => {
    if (!readProvider) return null;

    // If BrowserProvider (wallet), await getNetwork first to ensure ready
    try {
      // ethers v6: both BrowserProvider and JsonRpcProvider extend AbstractProvider (Runner)
      // We can pass the provider directly to Contract for view calls.
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LeaderboardAbi, readProvider);
      return contract;
    } catch (e) {
      console.error('Failed to create read-only contract:', e);
      setError(e);
      return null;
    }
  }, [readProvider]);

  const normalizeScore = (s) => ({
    player: s.player,
    word: s.word,
    // support either uint32/uint24 packed -> returned as BigInt-like in v6
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

  const loadPage = useCallback(async () => {
    if (!readProvider) return;
    setLoading(true);
    setError(null);

    try {
      const contract = await makeContract();
      if (!contract) throw new Error('No read provider available');

      // total rows
      const count = Number(await contract.getScoresCount());
      if (count !== total && offset === 0 && rows.length === 0) {
        setTotal(count);
      } else if (count !== total) {
        setTotal(count);
      }

      if (count === 0) {
        setRows([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // we fetch newest first using slice from the end
      // compute window [start, end)
      const remaining = count - offset;
      const take = Math.min(pageSize, remaining);
      const start = Math.max(0, count - offset - take);
      const end = count - offset;

      const page = await contract.getScoresSlice(start, take);
      // page is ascending within [start, end); we want newest first in UI
      const pageNorm = (page || []).map(normalizeScore);
      const pageNewestFirst = pageNorm.reverse();

      setRows((prev) => [...prev, ...pageNewestFirst]);
      setOffset(offset + take);
      setHasMore(offset + take < count);
    } catch (e) {
      console.error('Leaderboard load error:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [readProvider, makeContract, offset, pageSize, total, rows.length]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      return loadPage();
    }
  }, [loading, hasMore, loadPage]);

  const reload = useCallback(async () => {
    reset();
    // wait a tick so state resets before loading
    setTimeout(() => {
      loadPage();
    }, 0);
  }, [reset, loadPage]);

  // initial + whenever provider changes
  useEffect(() => {
    reset();
    if (readProvider) {
      loadPage();
    }
  }, [readProvider]); // eslint-disable-line react-hooks/exhaustive-deps

  return { rows, total, loading, error, hasMore, loadMore, reload };
}
