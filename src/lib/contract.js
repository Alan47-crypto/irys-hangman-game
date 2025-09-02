// src/lib/contract.js
import { ethers } from 'ethers';
import ABI from './abi/Leaderboard.json';

export const IRYS_CHAIN_ID = '0x4f6';
export const IRYS_RPC = 'https://testnet-rpc.irys.xyz/v1/execution-rpc';
export const LEADERBOARD_ADDRESS = '0xB2E65Ee0A08B27Bf576B03Fe197ebf1DC2c0AF6D';

export function getReadProvider() {
  return new ethers.JsonRpcProvider(IRYS_RPC);
}

// Normalize anything (EIP-1193, ethers Provider, ethers Signer) into a valid runner
export function normalizeRunner(providerOrSigner) {
  if (!providerOrSigner) return getReadProvider();

  // If it's an ethers Signer (v6), it will have getAddress()
  if (typeof providerOrSigner.getAddress === 'function') {
    return providerOrSigner; // already a Signer
  }

  // If it's a raw injected EIP-1193 provider from Web3-Onboard (has request)
  if (typeof providerOrSigner.request === 'function') {
    return new ethers.BrowserProvider(providerOrSigner);
  }

  // Otherwise assume it's already an ethers Provider
  return providerOrSigner;
}

export function getContract(providerOrSigner) {
  const runner = normalizeRunner(providerOrSigner);
  return new ethers.Contract(LEADERBOARD_ADDRESS, ABI, runner);
}

// Convenience: get a Signer from a Web3-Onboard wallet (injected provider)
export async function getSignerFromWallet(wallet) {
  const browserProvider = new ethers.BrowserProvider(wallet.provider);
  return await browserProvider.getSigner();
}
