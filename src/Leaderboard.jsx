// src/Leaderboard.jsx
import { useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLeaderboard } from './hooks/useLeaderboard';
import { getReadProvider } from './lib/contract';

export function Leaderboard({ provider }) {
  const readProvider = getReadProvider();

  const {
    rows,
    total,
    loading,
    error,
    hasMore,
    loadMore,
    reload,
  } = useLeaderboard(readProvider, 25);

  useEffect(() => {
    const handleReload = () => reload();
    window.addEventListener('irys:leaderboard:reload', handleReload);
    return () => window.removeEventListener('irys:leaderboard:reload', handleReload);
  }, [reload]);

  const top10 = useMemo(() => {
    const map = new Map();
    for (const s of rows) {
      const addr = s.player.toLowerCase();
      map.set(addr, (map.get(addr) || 0) + Number(s.points));
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [rows]);

  return (
    <div
      className="leaderboard-only-top10"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid var(--irys-secondary-accent)',
        borderRadius: 15,
        padding: 16,
        textAlign: 'center'
      }}
    >
      <h2 className="leaderboard-title">Leaderboard</h2>

      {error && (
        <div className="error-message" style={{ marginTop: 8 }}>
          Failed to load leaderboard: {String(error?.message || error)}
          <div style={{ marginTop: 8 }}>
            <button className="connect-button" onClick={reload} disabled={loading}>
              {loading ? 'Loading…' : 'Retry'}
            </button>
          </div>
        </div>
      )}

      {!error && top10.length === 0 && !loading && (
        <p style={{ opacity: 0.8, marginTop: 8 }}>No scores yet.</p>
      )}

      <div className="leaderboard-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', color: 'var(--irys-green)' }}>#</th>
              <th style={{ textAlign: 'left', padding: '8px', color: 'var(--irys-green)' }}>Player</th>
              <th style={{ textAlign: 'right', padding: '8px', color: 'var(--irys-green)' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {top10.map(([addr, score], idx) => (
              <tr key={addr} className={`rank-${idx + 1}`}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--irys-secondary-accent)' }}>
                  {idx + 1}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--irys-secondary-accent)', fontFamily: 'monospace' }}>
                  <code>{addr.slice(0, 6)}…{addr.slice(-4)}</code>
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--irys-secondary-accent)', textAlign: 'right' }}>
                  <strong>{score}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasMore && (
          <div style={{ marginTop: 12 }}>
            <button className="connect-button" onClick={loadMore} disabled={loading}>
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

Leaderboard.propTypes = {
  provider: PropTypes.any
};

export default Leaderboard;
