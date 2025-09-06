// src/lib/contract.js
import { ethers } from 'ethers';
import LeaderboardAbi from './abi/Leaderboard.json';

export const CONTRACT_ADDRESS = '0xB2E65Ee0A08B27Bf576B03Fe197ebf1DC2c0AF6D';
export const IRYS_CHAIN_ID_DEC = 1270;
export const IRYS_CHAIN_HEX = '0x4f6';

// You can override this in .env as VITE_IRYS_RPC (e.g. to "/api/rpc" if you use the proxy below)
export const PUBLIC_RPC =
  import.meta.env.VITE_IRYS_RPC || 'https://testnet-rpc.irys.xyz/v1/execution-rpc';

// ---------- Write helpers (wallet signer) ----------
export function getSignerAndContract(eip1193Provider) {
  if (!eip1193Provider) return { signer: null, contract: null };
  const browserProvider = new ethers.BrowserProvider(eip1193Provider);
  const signer = browserProvider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, LeaderboardAbi, signer);
  return { signer, contract };
}

// ---------- Read providers ----------
export function getWalletReadProvider(eip1193Provider) {
  const prov = eip1193Provider || (typeof window !== 'undefined' ? window.ethereum : null);
  if (!prov) return null;
  return new ethers.BrowserProvider(prov);
}

// Prefer public JsonRpcProvider (works without wallet). If it fails (CORS), fallback to wallet.
export function getPublicReadProvider() {
  try {
    const prov = new ethers.JsonRpcProvider(PUBLIC_RPC, {
      chainId: IRYS_CHAIN_ID_DEC,
      name: 'irys-testnet'
    });
    return prov;
  } catch (e) {
    console.warn('Failed to create public JsonRpcProvider:', e);
    return null;
  }
}

// Single entrypoint the app should use for READS
export function getReadProviderPreferPublic(eip1193Provider) {
  const pub = getPublicReadProvider();
  if (pub) return pub;
  return getWalletReadProvider(eip1193Provider);
}
