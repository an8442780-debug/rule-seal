import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getWalletState, selectWalletView, walletService } from '../services/walletService.ts';

describe('WalletService (EIP-6963 Discovery & Session Gate)', () => {
  it('does not invent MetaMask from an OKX compatibility provider', () => {
    const cleanup = walletService.initEIP6963();
    const request = vi.fn();
    const provider = { request, isMetaMask: true };
    (window as any).ethereum = provider;
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: {
      info: { uuid: 'actual-okx', name: 'OKX Wallet', icon: '', rdns: 'com.okex.wallet' }, provider,
    }}));
    expect(walletService.getDiscoveredProviders().map(p => p.info.rdns)).toEqual(['com.okex.wallet']);
    expect(request).not.toHaveBeenCalled();
    cleanup();
  });

  it('hides a flag-only MetaMask alias even when it is a separate router object', () => {
    (window as any).ethereum = { request: vi.fn(), isMetaMask: true };
    expect(walletService.getDiscoveredProviders()).toEqual([]);
  });

  it('keeps real MetaMask announced independently of the OKX compatibility alias', () => {
    const cleanup = walletService.initEIP6963();
    (window as any).ethereum = {request: vi.fn(), isMetaMask: true};
    const providers = [{request: vi.fn()}, {request: vi.fn()}];
    ['io.metamask', 'com.okex.wallet'].forEach((rdns, i) => {
      window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {detail: {
        info: {uuid: `real-${i}`, rdns, name: 'untrusted name', icon: 'https://invalid.example/icon'}, provider: providers[i],
      }}));
    });
    const options = walletService.getDiscoveredProviders();
    expect(options.map(p => p.info.name)).toEqual(['MetaMask', 'OKX Wallet']);
    expect(options.map(p => p.info.icon)).toEqual(['/wallets/metamask.svg', '/wallets/okx.png']);
    expect(options.map(p => p.provider)).toEqual(providers);
    providers.forEach(p => expect(p.request).not.toHaveBeenCalled());
    cleanup();
  });

  it('does not rebind an announced UUID or provider to a different wallet', () => {
    const cleanup = walletService.initEIP6963();
    const original = {request: vi.fn()};
    const replacement = {request: vi.fn()};
    const announce = (uuid: string, rdns: string, provider: any) => window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {detail: {
        info: {uuid, rdns, name: rdns, icon: ''}, provider,
      }}));
    announce('stable', 'com.okex.wallet', original);
    announce('stable', 'io.metamask', replacement);
    announce('changed-brand', 'io.metamask', original);
    announce('same-brand', 'com.okex.wallet', replacement);
    expect(walletService.getDiscoveredProviders()).toHaveLength(1);
    expect(walletService.getDiscoveredProviders()[0].provider).toBe(original);
    expect(walletService.getDiscoveredProviders()[0].info.name).toBe('OKX Wallet');
    cleanup();
  });

  it('deduplicates legacy provider aliases and supplies a branded icon', () => {
    const provider = { request: vi.fn(), isOkxWallet: true, isMetaMask: true };
    (window as any).ethereum = provider;
    (window as any).okxwallet = provider;
    const options = walletService.getDiscoveredProviders();
    expect(options).toHaveLength(1);
    expect(options[0].info.name).toBe('OKX Wallet');
    expect(options[0].info.icon).toBe('/wallets/okx.png');
  });

  it('rejects malformed rdns without crashing discovery', () => {
    const cleanup = walletService.initEIP6963();
    expect(() => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {detail: {
      info: {uuid: 'bad-rdns', name: 'Invalid', rdns: 12}, provider: {request: vi.fn()},
    }}))).not.toThrow();
    expect(walletService.getDiscoveredProviders()).toEqual([]);
    cleanup();
  });

  beforeEach(() => {
    walletService.disconnect();
    walletService.clearDiscoveredProviders();
    delete (window as any).ethereum;
    delete (window as any).okxwallet;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (window as any).ethereum;
    delete (window as any).okxwallet;
    vi.restoreAllMocks();
  });

  it.each([
    [[]],
    [['io.metamask']],
    [['com.okex.wallet']],
    [['io.rabby']],
    [['io.metamask', 'com.okex.wallet']],
    [['io.metamask', 'io.rabby']],
    [['com.okex.wallet', 'io.rabby']],
    [['io.metamask', 'com.okex.wallet', 'io.rabby']],
  ])('discovers the exact provider cardinality for %j', (rdnsSet) => {
    const cleanup = walletService.initEIP6963();
    for (const [index, rdns] of rdnsSet.entries()) {
      window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: {
        info: { uuid: `cardinality-${index}`, name: rdns, icon: '', rdns },
        provider: { request: vi.fn() },
      }}));
    }
    expect(walletService.getDiscoveredProviders().map((entry) => entry.info.rdns).sort())
      .toEqual([...rdnsSet].sort());
    cleanup();
  });

  it('initializes EIP-6963 listener and discovers allowlisted wallet providers (MetaMask, OKX, Rabby)', () => {
    const cleanup = walletService.initEIP6963();

    const mockMetaMask = {
      info: {
        uuid: 'uuid-metamask-1',
        name: 'MetaMask',
        icon: 'data:image/svg+xml;base64,mock',
        rdns: 'io.metamask',
      },
      provider: { request: vi.fn() },
    };

    const mockOkx = {
      info: {
        uuid: 'uuid-okx-1',
        name: 'OKX Wallet',
        icon: 'data:image/svg+xml;base64,mock',
        rdns: 'com.okex.wallet',
      },
      provider: { request: vi.fn() },
    };

    const mockRabby = {
      info: {
        uuid: 'uuid-rabby-1',
        name: 'Rabby Wallet',
        icon: 'data:image/svg+xml;base64,mock',
        rdns: 'io.rabby',
      },
      provider: { request: vi.fn() },
    };

    const mockUnauthorized = {
      info: {
        uuid: 'uuid-unauth-1',
        name: 'MaliciousInjectedWallet',
        icon: 'data:image/svg+xml;base64,mock',
        rdns: 'com.unauthorized.wallet',
      },
      provider: { request: vi.fn() },
    };

    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', { detail: mockMetaMask })
    );
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', { detail: mockOkx })
    );
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', { detail: mockRabby })
    );
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', { detail: mockUnauthorized })
    );

    const discovered = walletService.getDiscoveredProviders();
    expect(discovered.some((p) => p.info.rdns === 'io.metamask')).toBe(true);
    expect(discovered.some((p) => p.info.rdns === 'com.okex.wallet')).toBe(true);
    expect(discovered.some((p) => p.info.rdns === 'io.rabby')).toBe(true);
    expect(discovered.some((p) => p.info.rdns === 'com.unauthorized.wallet')).toBe(false);

    cleanup();
  });

  it('deduplicates duplicate announcement events by UUID and provider identity', () => {
    const cleanup = walletService.initEIP6963();
    const sharedProvider = { request: vi.fn() };

    const announce1 = {
      info: { uuid: 'uuid-1', name: 'MetaMask', icon: '', rdns: 'io.metamask' },
      provider: sharedProvider,
    };
    const announceDuplicate = {
      info: { uuid: 'uuid-1', name: 'MetaMask Re-announcement', icon: '', rdns: 'io.metamask' },
      provider: sharedProvider,
    };

    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', { detail: announce1 })
    );
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', { detail: announceDuplicate })
    );

    const discovered = walletService.getDiscoveredProviders();
    const metamaskEntries = discovered.filter((p) => p.info.rdns === 'io.metamask');
    expect(metamaskEntries.length).toBe(1);

    cleanup();
  });

  it('discards legacy fallback once valid EIP-6963 announcement arrives', () => {
    const cleanup = walletService.initEIP6963();

    const announce = {
      info: { uuid: 'uuid-eip6963', name: 'Rabby Wallet', icon: '', rdns: 'io.rabby' },
      provider: { request: vi.fn() },
    };

    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', { detail: announce })
    );

    const discovered = walletService.getDiscoveredProviders();
    expect(discovered.some((p) => p.info.uuid === 'legacy-injected')).toBe(false);
    expect(discovered.some((p) => p.info.uuid === 'uuid-eip6963')).toBe(true);

    cleanup();
  });

  it('connects to provider, validates chain ID, and updates state without ambient guessing', async () => {
    const mockAccounts = ['0x1111111111111111111111111111111111111111'];
    const mockRequest = vi.fn().mockImplementation(async ({ method }) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') return mockAccounts;
      if (method === 'eth_chainId') return '0xf22f'; // 61999 in hex
      return null;
    });

    const mockProviderDetail = {
      info: {
        uuid: 'uuid-okx-1',
        name: 'OKX Wallet',
        icon: 'data:image/svg+xml;base64,mock',
        rdns: 'com.okex.wallet',
      },
      provider: {
        request: mockRequest,
        on: vi.fn(),
        removeListener: vi.fn(),
      },
    };

    await walletService.connectProvider(mockProviderDetail as any);

    const state = walletService.getState();
    expect(state.connected).toBe(true);
    expect(state.address).toBe(mockAccounts[0]);
    expect(state.chainId).toBe(61999);
    expect(state.isCorrectChain).toBe(true);
    expect(state.providerName).toBe('OKX Wallet');
  });

  it('retains exact callback references and cleans them up on disconnect', async () => {
    const mockAccounts = ['0x1111111111111111111111111111111111111111'];
    const listeners: Record<string, Function> = {};
    const onMock = vi.fn((event, cb) => {
      listeners[event] = cb;
    });
    const removeListenerMock = vi.fn((event) => {
      delete listeners[event];
    });

    const mockRequest = vi.fn().mockImplementation(async ({ method }) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') return mockAccounts;
      if (method === 'eth_chainId') return '0xf22f';
      return null;
    });

    const mockDetail = {
      info: { uuid: 'uuid-1', name: 'Rabby Wallet', icon: '', rdns: 'io.rabby' },
      provider: { request: mockRequest, on: onMock, removeListener: removeListenerMock },
    };

    await walletService.connectProvider(mockDetail as any);
    expect(onMock).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    expect(onMock).toHaveBeenCalledWith('disconnect', expect.any(Function));

    listeners.accountsChanged(['0x2222222222222222222222222222222222222222']);
    expect(getWalletState()).toEqual(expect.objectContaining({
      phase: 'CONNECTED',
      address: '0x2222222222222222222222222222222222222222',
    }));
    expect(getWalletState().writeClientBinding?.address)
      .toBe('0x2222222222222222222222222222222222222222');

    listeners.chainChanged('0x1');
    expect(getWalletState().phase).toBe('WRONG_CHAIN');
    expect(getWalletState().writeClientBinding).toBeNull();

    listeners.chainChanged('0xf22f');
    expect(getWalletState().phase).toBe('CONNECTED');
    expect(getWalletState().writeClientBinding?.provider).toBe(mockDetail.provider);

    walletService.disconnect();
    expect(removeListenerMock).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
    expect(removeListenerMock).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    expect(removeListenerMock).toHaveBeenCalledWith('disconnect', expect.any(Function));

    const state = walletService.getState();
    expect(state.connected).toBe(false);
    expect(state.address).toBeNull();
    expect(state.chainId).toBeNull();
  });

  it('switches chain, adds chain on 4902 error, and re-reads eth_chainId', async () => {
    let currentChainHex = '0x1'; // mainnet
    let chainAdded = false;
    const mockRequest = vi.fn().mockImplementation(async ({ method, params }) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') return ['0x1111111111111111111111111111111111111111'];
      if (method === 'eth_chainId') return currentChainHex;
      if (method === 'wallet_switchEthereumChain') {
        if (!chainAdded) {
          const err: any = new Error('Chain not added');
          err.code = 4902;
          throw err;
        }
        currentChainHex = params[0].chainId;
        return null;
      }
      if (method === 'wallet_addEthereumChain') {
        chainAdded = true;
        return null;
      }
      return null;
    });

    const mockDetail = {
      info: { uuid: 'uuid-okx-switch', name: 'OKX Wallet', icon: '', rdns: 'com.okex.wallet' },
      provider: { request: mockRequest, on: vi.fn(), removeListener: vi.fn() },
    };

    await walletService.connectProvider(mockDetail as any);
    expect(walletService.getState().isCorrectChain).toBe(false);

    await walletService.switchChain();
    expect(mockRequest).toHaveBeenCalledWith({
      method: 'wallet_addEthereumChain',
      params: expect.any(Array),
    });

    const updatedState = walletService.getState();
    expect(updatedState.chainId).toBe(61999);
    expect(updatedState.isCorrectChain).toBe(true);
  });

  it('keeps a late announcement visible while CHOOSER_OPEN without requesting accounts', () => {
    const cleanup = walletService.initEIP6963();
    walletService.openChooser();
    const request = vi.fn();
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: {
      info: { uuid: 'late-okx', name: 'OKX Wallet', icon: '', rdns: 'com.okex.wallet' },
      provider: { request },
    }}));
    expect(getWalletState().phase).toBe('CHOOSER_OPEN');
    expect(walletService.getDiscoveredProviders()).toHaveLength(1);
    expect(request).not.toHaveBeenCalled();
    cleanup();
  });

  it('commits CONNECTED write client identity atomically to the selected provider', async () => {
    const address = '0x1111111111111111111111111111111111111111';
    const provider = { request: vi.fn(async ({ method }) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [address];
      if (method === 'eth_chainId') return '0xf22f';
      return null;
    }), on: vi.fn(), removeListener: vi.fn() };
    await walletService.connectProvider({
      info: { uuid: 'selected-rabby', name: 'Rabby', icon: '', rdns: 'io.rabby' }, provider,
    });
    const state = getWalletState();
    expect(state.phase).toBe('CONNECTED');
    expect(state.writeClientBinding).toEqual({ provider, address });
    expect(selectWalletView(state)).toEqual(expect.objectContaining({ canWrite: true, showConnect: false }));
  });

  it('enters WRONG_CHAIN and disables the write client until explicit recovery', async () => {
    const address = '0x1111111111111111111111111111111111111111';
    const provider = { request: vi.fn(async ({ method }) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [address];
      if (method === 'eth_chainId') return '0x1';
      return null;
    }), on: vi.fn(), removeListener: vi.fn() };
    await walletService.connectProvider({
      info: { uuid: 'wrong-chain', name: 'MetaMask', icon: '', rdns: 'io.metamask' }, provider,
    });
    const state = getWalletState();
    expect(state.phase).toBe('WRONG_CHAIN');
    expect(state.writeClientBinding).toBeNull();
    expect(selectWalletView(state).needsChainSwitch).toBe(true);
  });

  it('starts DISCONNECTED after reload and performs no automatic resubmit', () => {
    walletService.disconnect();
    const state = getWalletState();
    expect(state.phase).toBe('DISCONNECTED');
    expect(state.writeClientBinding).toBeNull();
  });

  it('enters ERROR and clears provider identity when account access is rejected', async () => {
    const provider = {
      request: vi.fn().mockRejectedValue(new Error('User rejected the request.')),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    await expect(walletService.connectProvider({
      info: { uuid: 'rejected', name: 'OKX Wallet', icon: '', rdns: 'com.okex.wallet' },
      provider,
    })).rejects.toThrow('User rejected the request.');
    expect(getWalletState()).toEqual(expect.objectContaining({
      phase: 'ERROR', connected: false, provider: null, writeClientBinding: null,
    }));
  });

  it('disconnects atomically when accountsChanged removes every account', async () => {
    const listeners: Record<string, Function> = {};
    const provider = {
      request: vi.fn(async ({ method }) => {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
          return ['0x1111111111111111111111111111111111111111'];
        }
        if (method === 'eth_chainId') return '0xf22f';
        return null;
      }),
      on: vi.fn((event, callback) => { listeners[event] = callback; }),
      removeListener: vi.fn(),
    };
    await walletService.connectProvider({
      info: { uuid: 'removed', name: 'Rabby', icon: '', rdns: 'io.rabby' }, provider,
    });
    listeners.accountsChanged([]);
    expect(getWalletState()).toEqual(expect.objectContaining({
      phase: 'DISCONNECTED', connected: false, address: null, provider: null,
      writeClientBinding: null,
    }));
  });
});
