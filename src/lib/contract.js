import { ethers } from 'ethers';
import LeaderboardAbi from './abi/Leaderboard.json';

export const CONTRACT_ADDRESS = '0xB2E65Ee0A08B27Bf576B03Fe197ebf1DC2c0AF6D';

export async function getSignerAndContract(eip1193Provider) {
  if (!eip1193Provider) return { provider: null, signer: null, contract: null };
  const browserProvider = new ethers.BrowserProvider(eip1193Provider);
  const signer = await browserProvider.getSigner();        // <-- await
  const contract = new ethers.Contract(CONTRACT_ADDRESS, LeaderboardAbi, signer);
  return { provider: browserProvider, signer, contract };
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
