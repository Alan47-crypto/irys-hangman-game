// src/lib/contract.js
import { ethers } from 'ethers';
import LeaderboardAbi from './abi/Leaderboard.json';

export const CONTRACT_ADDRESS = '0xB2E65Ee0A08B27Bf576B03Fe197ebf1DC2c0AF6D';
export const IRYS_CHAIN_ID_DEC = 1270;
export const IRYS_CHAIN_HEX = '0x4f6';

// ✅ Public read RPC (env overrideable). If you added a Vercel proxy, set VITE_IRYS_RPC=/api/rpc
export const PUBLIC_RPC =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_IRYS_RPC) ||
  'https://testnet-rpc.irys.xyz/v1/execution-rpc';

// ---------- Write helpers (wallet signer) ----------
export async function getSignerAndContract(eip1193Provider) {
  if (!eip1193Provider) return { provider: null, signer: null, contract: null };
  const browserProvider = new ethers.BrowserProvider(eip1193Provider);
  const signer = await browserProvider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, LeaderboardAbi, signer);
  return { provider: browserProvider, signer, contract };
}

// ---------- Read providers ----------
export function getWalletReadProvider(eip1193Provider) {
  const prov = eip1193Provider || (typeof window !== 'undefined' ? window.ethereum : null);
  if (!prov) return null;
  return new ethers.BrowserProvider(prov);
}

export function getPublicReadProvider() {
  try {
    // ethers v6: you can pass the expected chain (optional)
    return new ethers.JsonRpcProvider(PUBLIC_RPC, {
      chainId: IRYS_CHAIN_ID_DEC,
      name: 'irys-testnet',
    });
  } catch (e) {
    console.warn('Failed to create public JsonRpcProvider:', e);
    return null;
  }
}

// Prefer public RPC for reads; if not available, fall back to wallet provider
export function getReadProviderPreferPublic(eip1193Provider) {
  const pub = getPublicReadProvider();
  if (pub) return pub;
  return getWalletReadProvider(eip1193Provider);
}

export default {
  CONTRACT_ADDRESS,
  IRYS_CHAIN_ID_DEC,
  IRYS_CHAIN_HEX,
  PUBLIC_RPC,
  getSignerAndContract,
  getWalletReadProvider,
  getPublicReadProvider,
  getReadProviderPreferPublic,
};
