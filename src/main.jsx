import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// --- Web3-Onboard Imports ---
import { Web3OnboardProvider, init } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';

// --- Define the Irys Testnet for Web3-Onboard ---
const irysTestnet = {
  id: 1270,
  token: 'IRYS',
  label: 'Irys Testnet',
  rpcUrl: 'https://testnet-rpc.irys.xyz/v1/execution-rpc',
};

// --- Initialize Web3-Onboard ---
const injected = injectedModule();
const web3Onboard = init({
  wallets: [injected], // We are only enabling browser wallets like MetaMask
  chains: [irysTestnet],
  appMetadata: {
    name: 'Irys Hangman',
    description: 'A Hangman game on the Irys Testnet',
    icon: '<svg></svg>', // You can add an SVG icon here
  },
  connect: {
    autoConnectLastWallet: true
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <App />
    </Web3OnboardProvider>
  </React.StrictMode>,
);
