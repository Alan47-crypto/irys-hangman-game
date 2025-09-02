// src/hooks/usePlayerStats.js
import { useEffect, useState } from 'react';
import { getContract } from '../lib/contract';

/**
 * Reads (total score, win streak) for a given address.
 */
export function usePlayerStats(provider, address) {
  const [stats, setStats] = useState({ total: 0, streak: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!provider || !address) return;
      setLoading(true); setError(null);
      try {
        const c = getContract(provider);
        const [total, streak] = await c.getPlayerStats(address);
        if (!mounted) return;
        setStats({ total: Number(total), streak: Number(streak) });
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [provider, address]);

  return { ...stats, loading, error };
}
