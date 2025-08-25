// src/App.jsx
import { useConnectWallet } from '@web3-onboard/react';
import { HangmanGame } from './HangmanGame.jsx';
import { Leaderboard } from './Leaderboard.jsx';
import './App.css';
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import backgroundVideo from './assets/background-loop.mp4';

function AccountInfo({ wallet, balance, disconnect }) {
  if (!wallet) return null;
  const address = wallet.accounts[0].address;
  return (
    <div className="account-info-wrapper" onClick={() => disconnect(wallet)} title="Click to disconnect">
      <span className="balance">{balance} IRYS</span>
      <span className="address">
        <img src={`https://www.gravatar.com/avatar/${address}?d=identicon`} alt="Wallet avatar" className="avatar" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    </div>
  );
}

function App() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [balance, setBalance] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  useEffect(() => {
    if (wallet) {
      const fetchBalance = async () => {
        const ethersProvider = new ethers.BrowserProvider(wallet.provider);
        const signer = await ethersProvider.getSigner();
        const balanceWei = await ethersProvider.getBalance(signer.address);
        const balanceFormatted = parseFloat(ethers.formatEther(balanceWei)).toFixed(3);
        setBalance(balanceFormatted);
      };
      fetchBalance();
    }
  }, [wallet]);

  return (
    <div className="container">
      <video ref={videoRef} autoPlay loop muted id="background-video">
        <source src={backgroundVideo} type="video/mp4" />
      </video>

      <header>
        <div className="header-left"></div> {/* Invisible spacer */}
        <h1 className="header-center">Irys Hangman</h1>
        <div className="header-right">
          {!wallet ? (
            <button className="connect-button" disabled={connecting} onClick={() => connect()}>
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <AccountInfo wallet={wallet} balance={balance} disconnect={disconnect} />
          )}
        </div>
      </header>
      
      <main>
        {wallet ? (
          <div className="main-content">
            <div className="game-wrapper">
              <HangmanGame provider={wallet.provider} />
            </div>
            <div className="leaderboard-wrapper">
              <Leaderboard provider={wallet.provider} />
            </div>
          </div>
        ) : (
          <div className="connect-prompt">
            {/* The duplicated title has been removed from here */}
            <h2>Please connect your wallet to play.</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;