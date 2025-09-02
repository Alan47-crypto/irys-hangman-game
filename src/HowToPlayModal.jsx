// src/HowToPlayModal.jsx
import { useState, useEffect } from "react";

export function HowToPlayModal({ trigger }) {
  const [isOpen, setIsOpen] = useState(false);

  // Open once on first load
  useEffect(() => {
    setIsOpen(true);
  }, []);

  // Re-open whenever trigger changes (counter from App)
  useEffect(() => {
    if (trigger !== undefined) setIsOpen(true);
  }, [trigger]);

  if (!isOpen) return null;

  // Inline fallback styles to guarantee overlay even if CSS fails to load
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26, 26, 26, 0.95)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  };
  const contentStyle = {
    background: 'rgba(0, 0, 0, 0.85)',
    border: '2px solid #6BFFDD',
    borderRadius: 15,
    padding: '2rem',
    maxWidth: 520,
    width: '90%',
    color: '#f1f1f1',
    textAlign: 'left',
    boxShadow: '0 0 20px rgba(107, 255, 221, 0.6)'
  };

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={contentStyle}>
        <h2 style={{ color: '#6BFFDD', textAlign: 'center', marginBottom: '1rem' }}>🎮 How to Play</h2>

        <p>
          <strong>Irys Hangman</strong> follows the <em>classic Hangman rules</em> —
          but with a twist: all words are <strong>Irys</strong> and <strong>crypto</strong> themed.
        </p>

        <ol style={{ margin: '0 0 1rem 1rem', paddingLeft: '0.5rem' }}>
          <li>A hidden blockchain/Irys-related word is chosen at random.</li>
          <li>
            Click letters on the on-screen keyboard to guess:
            <ul style={{ margin: '0.4rem 0 0.8rem 1.2rem', paddingLeft: '0.5rem' }}>
              <li>✅ Correct letters fill in the blanks.</li>
              <li>❌ Wrong guesses makes the mascot darker — you only get <strong>6 mistakes</strong>!</li>
            </ul>
          </li>
          <li>
            Solve the word before running out of guesses:
            <ul style={{ margin: '0.4rem 0 0.8rem 1.2rem', paddingLeft: '0.5rem' }}>
              <li>🎉 You win! Your score is based on word length, speed, and mistakes.</li>
              <li>📜 Your score is saved <strong>on-chain</strong> to the Irys Testnet leaderboard.</li>
            </ul>
          </li>
          <li>
            Fail to solve the word:
            <ul style={{ margin: '0.4rem 0 0.8rem 1.2rem', paddingLeft: '0.5rem' }}>
              <li>💀 You lose, and your win streak resets on-chain.</li>
            </ul>
          </li>
        </ol>

        <p><strong>Goal:</strong> Climb the <em>Top 10 Leaderboard</em> and prove you’re the sharpest Irys degen.</p>

        <p className="modal-footer" style={{ textAlign: 'center', marginTop: '1rem', color: '#6BFFDD' }}>
          Created with 🩵 by{" "}
          <a href="https://x.com/0xKangLiu" target="_blank" rel="noreferrer" style={{ color: '#6BFFDD', textDecoration: 'none' }}>
            Alan
          </a>
        </p>

        <button
          className="close-button"
          onClick={() => setIsOpen(false)}
          style={{
            display: 'block',
            margin: '1.25rem auto 0',
            padding: '0.8rem 2rem',
            background: '#6BFFDD',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: 8,
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Let’s Play
        </button>
      </div>
    </div>
  );
}
