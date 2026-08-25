export const STUDIONET_CONFIG = {
  chainId: 61999,
  chainIdHex: '0xf22f',
  chainName: 'GenLayer Studionet',
  rpcUrl: 'https://studio.genlayer.com/api',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
  blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
};

export const STUDIONET_EXPLORER = STUDIONET_CONFIG.blockExplorerUrls[0];

export const CONTRACT_ADDRESS: string = import.meta.env.VITE_CONTRACT_ADDRESS || '';

export const ALLOWED_WALLETS = ['MetaMask', 'OKX Wallet', 'Rabby Wallet', 'Rabby'] as const;

export const OFFICIAL_ECFR_BASE = 'https://www.ecfr.gov/api/versioner/v1';
export const OFFICIAL_FR_BASE = 'https://www.federalregister.gov';
