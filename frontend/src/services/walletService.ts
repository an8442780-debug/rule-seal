import { STUDIONET_CONFIG } from '../config/chain.ts';
import { EIP6963ProviderDetail, WalletState } from '../types/domain.ts';

type Listener = (state: WalletState) => void;

export const WALLET_SESSION_STATE_MACHINE = true;
export type WalletPhase = 'DISCONNECTED' | 'DISCOVERING' | 'CHOOSER_OPEN' | 'CONNECTING' |
  'CONNECTED' | 'WRONG_CHAIN' | 'ERROR';
type WalletSessionState = WalletState & {
  phase: WalletPhase;
  error: string | null;
  writeClientBinding: { provider: any; address: string } | null;
};

export const selectWalletView = (state: WalletSessionState) => ({
  phase: state.phase,
  canWrite: state.phase === 'CONNECTED' && Boolean(state.writeClientBinding),
  needsChainSwitch: state.phase === 'WRONG_CHAIN',
  showConnect: state.phase !== 'CONNECTED' && state.phase !== 'WRONG_CHAIN',
});

const STRICT_RDNS_ALLOWLIST = ['io.metamask', 'com.okex.wallet', 'io.rabby'];

export class WalletService {
  private static instance: WalletService;
  private announcedProviders: Map<string, EIP6963ProviderDetail> = new Map();
  private activeListenersCleanup: (() => void) | null = null;
  private state: WalletSessionState = {
    phase: 'DISCONNECTED',
    connected: false,
    address: null,
    chainId: null,
    provider: null,
    providerName: null,
    isCorrectChain: false,
    error: null,
    writeClientBinding: null,
  };
  private listeners: Set<Listener> = new Set();

  private constructor() {
    // Reload always starts disconnected
  }

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  public initEIP6963(): () => void {
    if (typeof window === 'undefined') return () => {};

    if (this.state.phase === 'DISCONNECTED') {
      this.state = { ...this.state, phase: 'DISCOVERING', error: null };
      this.notifyListeners();
    }

    const handleAnnouncement = (event: any) => {
      if (!event.detail || !event.detail.info || !event.detail.provider) return;
      const { info, provider } = event.detail;

      const rdns = (info.rdns || '').toLowerCase();
      if (
        typeof info.uuid !== 'string' || !info.uuid ||
        typeof info.name !== 'string' || !info.name ||
        typeof info.rdns !== 'string' ||
        typeof provider.request !== 'function'
      ) return;

      // Strict RDNS allowlist check
      if (!STRICT_RDNS_ALLOWLIST.includes(rdns)) return;


      // Deduplicate by UUID and provider identity
      const existingKey = Array.from(this.announcedProviders.keys()).find((k) => {
        const entry = this.announcedProviders.get(k);
        return entry && (entry.provider === provider || entry.info.uuid === info.uuid);
      });

      const key = existingKey || info.uuid || `${info.name}:${info.rdns}`;
      this.announcedProviders.set(key, { info, provider });
      this.notifyListeners();
    };

    window.addEventListener('eip6963:announceProvider', handleAnnouncement);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnouncement);
    };
  }

  public getDiscoveredProviders(): EIP6963ProviderDetail[] {
    const list = Array.from(this.announcedProviders.values());
    if (typeof window === 'undefined') return list;
    // EIP-6963 announcements replace only the same legacy wallet; other detected
    // wallets remain selectable. Ambiguous flags fail closed.
    const candidates = [
      ...(((window as any).ethereum?.providers ?? []) as any[]),
      (window as any).ethereum,
      (window as any).okxwallet,
    ].filter((provider) => provider && typeof provider.request === 'function');
    const legacy = candidates.flatMap((provider) => {
      const ids = [provider.isMetaMask === true ? ['MetaMask', 'io.metamask'] : [],
        provider.isOkxWallet === true || provider.isOKExWallet === true ? ['OKX Wallet', 'com.okex.wallet'] : [],
        provider.isRabby === true ? ['Rabby', 'io.rabby'] : []].filter((entry) => entry.length);
      if (ids.length !== 1) return [];
      const [name, rdns] = ids[0];
      if (list.some((item) => item.info.rdns.toLowerCase() === rdns)) return [];
      return [{ info: { uuid: `legacy-${rdns}`, name, icon: '', rdns }, provider }];
    });
    return [...list, ...legacy];
  }

  public getState(): WalletState {
    return { ...this.state };
  }

  public getWalletState(): WalletSessionState {
    return { ...this.state };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeWalletState(listener: (state: WalletSessionState) => void): () => void {
    return this.subscribe((state) => listener(state as WalletSessionState));
  }

  public openChooser(): void {
    if (this.state.phase === 'CONNECTED' || this.state.phase === 'WRONG_CHAIN') return;
    this.state = { ...this.state, phase: 'CHOOSER_OPEN', error: null };
    this.notifyListeners();
  }

  public closeChooser(): void {
    if (this.state.phase !== 'CHOOSER_OPEN') return;
    this.state = { ...this.state, phase: 'DISCOVERING' };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  public async connectProvider(providerDetail: EIP6963ProviderDetail): Promise<void> {
    const provider = providerDetail.provider;
    if (!provider || typeof provider.request !== 'function') {
      throw new Error('PROVIDER_INVALID');
    }

    // Cleanup any prior listeners
    if (this.activeListenersCleanup) {
      this.activeListenersCleanup();
      this.activeListenersCleanup = null;
    }

    this.state = { ...this.state, phase: 'CONNECTING', connected: false, error: null, writeClientBinding: null };
    this.notifyListeners();

    let accounts: string[];
    let rawChainId: string;
    try {
      await provider.request({ method: 'eth_requestAccounts' });
      accounts = await provider.request({ method: 'eth_accounts' });
      rawChainId = await provider.request({ method: 'eth_chainId' });
      if (!accounts || accounts.length === 0) throw new Error('NO_ACCOUNTS_RETURNED');
      if (!/^0x[0-9a-fA-F]{40}$/.test(accounts[0])) throw new Error('INVALID_ACCOUNT_ADDRESS');
    } catch (error: any) {
      this.state = { ...this.state, phase: 'ERROR', connected: false, provider: null,
        address: null, chainId: null, providerName: null, isCorrectChain: false,
        writeClientBinding: null, error: error?.message || 'WALLET_CONNECTION_FAILED' };
      this.notifyListeners();
      throw error;
    }

    const chainId = parseInt(rawChainId, 16);
    const isCorrectChain = chainId === STUDIONET_CONFIG.chainId;

    this.state = {
      phase: isCorrectChain ? 'CONNECTED' : 'WRONG_CHAIN',
      connected: true,
      address: accounts[0],
      chainId,
      provider,
      providerName: providerDetail.info.name,
      isCorrectChain,
      error: null,
      writeClientBinding: isCorrectChain ? { provider, address: accounts[0] } : null,
    };

    // Attach listeners on this exact provider with exact callback references
    const handleAccountsChanged = (newAccounts: string[]) => {
      if (!newAccounts || newAccounts.length === 0) {
        this.disconnect();
      } else {
        const address = newAccounts[0];
        if (!/^0x[0-9a-fA-F]{40}$/.test(address)) { this.disconnect(); return; }
        this.state = {
          ...this.state,
          address,
          writeClientBinding: this.state.isCorrectChain ? { provider, address } : null,
        };
        this.notifyListeners();
      }
    };

    const handleChainChanged = (newChainHex: string) => {
      const newChain = parseInt(newChainHex, 16);
      const isCorrectChain = newChain === STUDIONET_CONFIG.chainId;
      this.state = {
        ...this.state,
        chainId: newChain,
        isCorrectChain,
        phase: isCorrectChain ? 'CONNECTED' : 'WRONG_CHAIN',
        writeClientBinding: isCorrectChain && this.state.address
          ? { provider, address: this.state.address } : null,
      };
      this.notifyListeners();
    };

    const handleDisconnect = () => {
      this.disconnect();
    };

    if (typeof provider.on === 'function') {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      provider.on('disconnect', handleDisconnect);

      this.activeListenersCleanup = () => {
        if (typeof provider.removeListener === 'function') {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
          provider.removeListener('disconnect', handleDisconnect);
        } else if (typeof provider.off === 'function') {
          provider.off('accountsChanged', handleAccountsChanged);
          provider.off('chainChanged', handleChainChanged);
          provider.off('disconnect', handleDisconnect);
        }
      };
    }

    this.notifyListeners();
  }

  public async switchChain(): Promise<void> {
    if (!this.state.provider) throw new Error('NO_PROVIDER_CONNECTED');
    try {
      await this.state.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: STUDIONET_CONFIG.chainIdHex }],
      });
    } catch (switchError: any) {
      // 4902 means chain has not been added yet
      if (switchError?.code === 4902 || switchError?.message?.includes('4902')) {
        await this.state.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: STUDIONET_CONFIG.chainIdHex,
              chainName: STUDIONET_CONFIG.chainName,
              rpcUrls: [STUDIONET_CONFIG.rpcUrl],
              nativeCurrency: STUDIONET_CONFIG.nativeCurrency,
              blockExplorerUrls: STUDIONET_CONFIG.blockExplorerUrls,
            },
          ],
        });
        await this.state.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: STUDIONET_CONFIG.chainIdHex }],
        });
      } else {
        throw switchError;
      }
    }

    // Re-read active chainId after switch attempt
    try {
      const rawChainId: string = await this.state.provider.request({
        method: 'eth_chainId',
      });
      const newChain = parseInt(rawChainId, 16);
      this.state.chainId = newChain;
      this.state.isCorrectChain = newChain === STUDIONET_CONFIG.chainId;
      this.state.phase = this.state.isCorrectChain ? 'CONNECTED' : 'WRONG_CHAIN';
      this.state.writeClientBinding = this.state.isCorrectChain && this.state.address
        ? { provider: this.state.provider, address: this.state.address } : null;
      this.notifyListeners();
      if (!this.state.isCorrectChain) throw new Error('CHAIN_SWITCH_NOT_CONFIRMED');
    } catch (err) {
      this.state.phase = 'WRONG_CHAIN';
      this.state.isCorrectChain = false;
      this.state.writeClientBinding = null;
      this.state.error = err instanceof Error ? err.message : 'CHAIN_SWITCH_NOT_CONFIRMED';
      this.notifyListeners();
      throw err;
    }
  }

  public clearDiscoveredProviders(): void {
    this.announcedProviders.clear();
  }

  public disconnect(): void {
    if (this.activeListenersCleanup) {
      this.activeListenersCleanup();
      this.activeListenersCleanup = null;
    }

    this.state = {
      phase: 'DISCONNECTED',
      connected: false,
      address: null,
      chainId: null,
      provider: null,
      providerName: null,
      isCorrectChain: false,
      error: null,
      writeClientBinding: null,
    };
    this.notifyListeners();
  }
}

export const walletService = WalletService.getInstance();
export const getWalletState = () => walletService.getWalletState();
export const subscribeWalletState = (listener: (state: WalletSessionState) => void) =>
  walletService.subscribeWalletState(listener);
