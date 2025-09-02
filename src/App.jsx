// src/App.jsx
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

import { HangmanGame } from './HangmanGame.jsx';
import { Leaderboard } from './Leaderboard.jsx';
import { HowToPlayModal } from './HowToPlayModal';
import './App.css';

const IRYS_CHAIN_ID = '0x4f6'; // Irys Testnet (1270) in hex, lowercase

const IRYS_CHAIN_PARAMS = {
  chainId: IRYS_CHAIN_ID,
  chainName: 'Irys Testnet',
  rpcUrls: ['https://testnet-rpc.irys.xyz/v1/execution-rpc'],
  nativeCurrency: { name: 'IRYS', symbol: 'IRYS', decimals: 18 },
  blockExplorerUrls: ['https://testnet-explorer.irys.xyz']
};

// Helper: switch/add chain (MetaMask-friendly: non-empty blockExplorerUrls)
const handleSwitchNetwork = async (wallet, setChain, setSwitchError) => {
  setSwitchError(null);
  try {
    const result = await setChain({ chainId: IRYS_CHAIN_ID });
    if (result?.error) {
      console.error('setChain error:', result.error);
      if (result.error.code === 4902 && wallet?.provider?.request) {
        try {
          await wallet.provider.request({
            method: 'wallet_addEthereumChain',
            params: [IRYS_CHAIN_PARAMS]
          });
        } catch (addError) {
          console.error('Failed to add chain:', addError);
          setSwitchError('Failed to add Irys Testnet. Please add it manually in your wallet.');
        }
      } else {
        setSwitchError('Failed to switch network. Please try again or add Irys Testnet manually.');
      }
    }
  } catch (err) {
    console.error('Unexpected network switch error:', err);
    setSwitchError('Unexpected error while switching network.');
  }
};

function AccountInfo({ wallet, balance, disconnect }) {
  if (!wallet) return null;
  const address = wallet.accounts[0].address;
  return (
    <div
      className="account-info-wrapper"
      onClick={() => disconnect(wallet)}
      title="Click to disconnect"
      role="button"
      tabIndex={0}
    >
      <span className="balance">{balance} IRYS</span>
      <span className="address">
        <img
          src={`https://www.gravatar.com/avatar/${address}?d=identicon`}
          alt="Wallet avatar"
          className="avatar"
        />
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    </div>
  );
}

function NetworkGuard({ children, wallet, connecting, connect, connectedChain }) {
  const [switchError, setSwitchError] = useState(null);
  const [{}, setChain] = useSetChain();

  // 1) No wallet: ONLY show the big connect prompt (no header button)
  if (!wallet) {
    return (
      <div className="connect-prompt">
        <h2>Please connect your wallet to play.</h2>
        <button
          className="connect-button"
          disabled={connecting}
          onClick={async () => await connect()}
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    );
  }

  // 2) Wrong network: show switch UI here, not in header
  if (connectedChain?.id !== IRYS_CHAIN_ID) {
    return (
      <div className="connect-prompt">
        <h2>Wrong Network</h2>
        <p>Please switch to Irys Testnet to continue playing</p>
        <button
          className="switch-network-btn"
          onClick={() => handleSwitchNetwork(wallet, setChain, setSwitchError)}
        >
          Switch to Irys Testnet
        </button>
        {switchError && (
          <div className="error-message">
            <p>{switchError}</p>
            <ul>
              <li>Network Name: Irys Testnet</li>
              <li>RPC URL: https://testnet-rpc.irys.xyz/v1/execution-rpc</li>
              <li>Chain ID: 1270 (0x4f6 in hex)</li>
              <li>Currency Symbol: IRYS</li>
              <li>Block Explorer: https://testnet-explorer.irys.xyz</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return children;
}

function App() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [{ connectedChain }, setChain] = useSetChain();

  const [balance, setBalance] = useState('');
  const [switchError, setSwitchError] = useState(null);

  // use a counter to re-trigger modal each click
  const [helpTick, setHelpTick] = useState(0);

  const videoRef = useRef(null);

  // Slow down background video a touch
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.5;
  }, []);

  // Auto-try to switch after connect if wrong chain
  useEffect(() => {
    if (wallet && connectedChain && connectedChain.id !== IRYS_CHAIN_ID) {
      handleSwitchNetwork(wallet, setChain, setSwitchError);
    }
  }, [wallet, connectedChain, setChain]);

  // Balance fetch (only on correct chain)
  useEffect(() => {
    let cancelled = false;
    const fetchBalance = async () => {
      try {
        if (!(wallet && connectedChain?.id === IRYS_CHAIN_ID)) {
          if (!cancelled) setBalance('');
          return;
        }
        const ethersProvider = new ethers.BrowserProvider(wallet.provider);
        const signer = await ethersProvider.getSigner();
        const addr = await signer.getAddress();
        const balanceWei = await ethersProvider.getBalance(addr);
        const balanceFormatted = parseFloat(ethers.formatEther(balanceWei)).toFixed(3);
        if (!cancelled) setBalance(balanceFormatted);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        if (!cancelled) setBalance('');
      }
    };
    fetchBalance();
    return () => { cancelled = true; };
  }, [wallet, connectedChain]);

  return (
    <div className="container">
      <video ref={videoRef} autoPlay loop muted playsInline id="background-video">
        <source src="/background-loop.mp4" type="video/mp4" />
      </video>

      <header>
        <div className="header-left" />
        <h1 className="header-center">Irys Hangman</h1>
        <div className="header-right">
          {/* Help "?" button always available */}
          <button className="help-button" onClick={() => setHelpTick(t => t + 1)}>?</button>

          {/* No connect/switch buttons in header. Only account info when ready */}
          {wallet && connectedChain?.id === IRYS_CHAIN_ID && (
            <AccountInfo wallet={wallet} balance={balance} disconnect={disconnect} />
          )}
          {switchError && <div className="error-message">{switchError}</div>}
        </div>
      </header>

      <main>
        <NetworkGuard
          wallet={wallet}
          connecting={connecting}
          connect={connect}
          connectedChain={connectedChain}
        >
          <div
            className="main-content"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(500px, 800px) minmax(320px, 400px)',
              columnGap: '1.25rem',
              alignItems: 'stretch'
            }}
          >
            <div
              className="game-wrapper"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
            >
              <HangmanGame provider={wallet?.provider} />
            </div>

            <div
              className="leaderboard-wrapper"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}
            >
              <div className="leaderboard-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <Leaderboard provider={wallet?.provider} />
              </div>
            </div>
          </div>
        </NetworkGuard>
      </main>

      {/* Footer OUTSIDE <main> so it centers properly */}
      <footer className="credit">
        Created with 🩵 by{' '}
        <a href="https://x.com/0xKangLiu" target="_blank" rel="noopener noreferrer">
          Alan
        </a>
      </footer>

      {/* Modal mounts once and can be re-opened via the "?" button (counter trigger) */}
      <HowToPlayModal trigger={helpTick} />
    </div>
  );
}

export default App;
