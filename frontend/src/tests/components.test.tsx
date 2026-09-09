import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Header } from '../components/Header.tsx';
import { DeploymentBanner } from '../components/DeploymentBanner.tsx';
import { WalletModal } from '../components/WalletModal.tsx';
import { PublicLookup } from '../components/PublicLookup.tsx';
import { OwnerWorkbench } from '../components/OwnerWorkbench.tsx';
import { ResolverWorkbench } from '../components/ResolverWorkbench.tsx';
import { IntegratorWorkbench } from '../components/IntegratorWorkbench.tsx';
import { SuccessorWizard } from '../components/SuccessorWizard.tsx';
import { AuditorView } from '../components/AuditorView.tsx';
import { App } from '../App.tsx';
import { RegulatoryLandingIntro } from '../components/RegulatoryLandingIntro.tsx';
import { contractService } from '../services/contractService.ts';
import { sharedRpc } from '../services/rpcClient.ts';
import { JOURNAL_STORAGE_KEY } from '../services/journalService.ts';
import { TransactionStatusModal } from '../components/TransactionStatusModal.tsx';
import type { TxStep } from '../types/domain.ts';
import { CaseRecord } from '../types/domain.ts';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

describe('Mounted Page Components & User Workflows', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    sharedRpc.clearCache();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (root && container) {
      act(() => {
        root?.unmount();
      });
      container.remove();
      container = null;
      root = null;
    }
  });

  it('provides all workflow guidance without RPC or wallet requests', async () => {
    const read = vi.spyOn(sharedRpc, 'readContract');
    const request = vi.fn();
    const original = (window as any).ethereum;
    (window as any).ethereum = { request };
    try {
      await act(async () => { root?.render(<RegulatoryLandingIntro />); });
      const guide = container?.querySelector('details');
      expect(guide?.querySelector('summary')?.textContent).toContain('How it works');
      expect(guide?.textContent).toContain('Create Draft Case');
      expect(guide?.textContent).toContain('Freeze Case for Resolver Assessment');
      expect(guide?.textContent).toContain('Execute Validator Assessment');
      expect(guide?.textContent).toContain('Create Successor Draft');
      expect(guide?.textContent).toContain('Bind / Advance Integration Namespace');
      expect(guide?.textContent).toContain('Auditor Hub');
      expect(guide?.textContent).toContain('does not supersede the predecessor');
      expect(guide?.textContent).toContain('three total assessment attempts');
      expect(guide?.textContent).toContain('Reconcile with Chain');
      expect(read).not.toHaveBeenCalled();
      expect(request).not.toHaveBeenCalled();
    } finally { (window as any).ethereum = original; }
  });

  it.each<TxStep>(['IDLE', 'WAITING_FOR_WALLET', 'SUBMITTED', 'WAITING_FOR_FINALITY', 'VERIFYING_EXECUTION', 'VERIFYING_READBACK', 'SUCCESS', 'REJECTED', 'FAILED', 'RECONCILIATION_REQUIRED'])('renders the actual transaction phase %s with correct spinner and announcement', async (step) => {
    const hash = `0x${'b'.repeat(64)}`;
    await act(async () => { root?.render(<TransactionStatusModal isOpen step={step} detail={{ txHash: hash }} onClose={vi.fn()} />); });
    const phase = document.querySelector('[data-transaction-phase]');
    if (step === 'IDLE') { expect(phase).toBeNull(); return; }
    expect(phase?.getAttribute('data-transaction-phase')).toBe(step);
    const pending = ['WAITING_FOR_WALLET', 'SUBMITTED', 'WAITING_FOR_FINALITY', 'VERIFYING_EXECUTION', 'VERIFYING_READBACK'].includes(step);
    expect(Boolean(document.querySelector('.transaction-spinner'))).toBe(pending);
    expect(document.querySelector('.transaction-hash code')?.textContent).toBe(hash);
    expect(phase?.getAttribute('role')).toBe(['REJECTED', 'FAILED', 'RECONCILIATION_REQUIRED'].includes(step) ? 'alert' : 'status');
    expect(document.querySelector('#tx-modal-title')?.textContent === 'Transaction complete').toBe(step === 'SUCCESS');
  });

  it('contains focus from the dialog boundary and restores the original trigger across phase changes', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const close = vi.fn();
    try {
      await act(async () => { root?.render(<TransactionStatusModal isOpen step="WAITING_FOR_FINALITY" detail={{ txHash: `0x${'a'.repeat(64)}` }} onClose={close} />); });
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
      dialog.focus();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
      expect(document.activeElement?.tagName).toBe('A');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      expect(close).not.toHaveBeenCalled();
      await act(async () => { root?.render(<TransactionStatusModal isOpen step="SUCCESS" onClose={close} />); });
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      expect(close).toHaveBeenCalledOnce();
      await act(async () => { root?.render(<TransactionStatusModal isOpen={false} step="IDLE" onClose={close} />); });
      expect(document.activeElement).toBe(trigger);
    } finally { trigger.remove(); }
  });

  it('keeps public workflows mounted and reports unreadable recovery data without deleting it', async () => {
    localStorage.setItem(JOURNAL_STORAGE_KEY, '{broken');
    vi.spyOn(contractService, 'getCaseCount').mockResolvedValue(0);
    await act(async () => { root?.render(<App />); });
    expect(container?.textContent).toContain('Recovery storage is unavailable or unreadable');
    expect(container?.querySelector('[role="tablist"]')).not.toBeNull();
    expect(localStorage.getItem(JOURNAL_STORAGE_KEY)).toBe('{broken');
    const reconcile = Array.from(container!.querySelectorAll('button')).find((button) => button.textContent === 'Reconcile with Chain')!;
    await act(async () => { reconcile.click(); });
    expect(container?.textContent).toContain('Verification could not finish');
    expect(reconcile.disabled).toBe(false);
    expect(localStorage.getItem(JOURNAL_STORAGE_KEY)).toBe('{broken');
  });

  it('renders the Connect wallet action only for disconnected Header state', async () => {
    const mockOpenModal = vi.fn();
    const mockDisconnect = vi.fn();
    const mockSwitchChain = vi.fn();

    const state = {
      connected: false,
      address: null,
      chainId: null,
      provider: null,
      providerName: null,
      isCorrectChain: false,
    };

    await act(async () => {
      root?.render(
        <Header
          walletState={state}
          onOpenWalletModal={mockOpenModal}
          onDisconnect={mockDisconnect}
          onSwitchChain={mockSwitchChain}
        />
      );
    });

    expect(container?.textContent).toContain('RuleSeal');
    expect(container?.textContent).toContain('Connect Wallet');

    const connectBtn = container?.querySelector('button');
    expect(connectBtn).not.toBeNull();
    connectBtn?.click();
    expect(mockOpenModal).toHaveBeenCalled();
  });

  it('renders DeploymentBanner with contract address warning or status', async () => {
    await act(async () => {
      root?.render(<DeploymentBanner />);
    });

    expect(container?.textContent).toContain('Deployment Not Configured');
  });

  it('renders WalletModal with discovered EIP-6963 providers', async () => {
    const mockSelect = vi.fn();
    const mockClose = vi.fn();

    const providers = [
      {
        info: { uuid: 'uuid-1', name: 'MetaMask', icon: '', rdns: 'io.metamask' },
        provider: { request: vi.fn() },
      },
      {
        info: { uuid: 'uuid-2', name: 'OKX Wallet', icon: '', rdns: 'com.okex.wallet' },
        provider: { request: vi.fn() },
      },
    ];

    await act(async () => {
      root?.render(
        <WalletModal
          isOpen={true}
          onClose={mockClose}
          providers={providers as any}
          onSelectProvider={mockSelect}
        />
      );
    });

    expect(document.body.textContent).toContain('Select Wallet');
    expect(document.body.textContent).toContain('MetaMask');
    expect(document.body.textContent).toContain('OKX Wallet');
    expect(document.activeElement?.textContent).toContain('MetaMask');
    const metamaskButton = document.querySelector('[aria-label="Connect with MetaMask"]')!;
    expect(metamaskButton.querySelector('img')?.getAttribute('src')).toBe('/wallets/metamask.svg');
    expect(document.querySelector('[aria-label="Connect with OKX Wallet"] img')?.getAttribute('src')).toBe('/wallets/okx.png');
    expect(mockSelect).not.toHaveBeenCalled();
    providers.forEach(p => expect(p.provider.request).not.toHaveBeenCalled());
    const icon = metamaskButton.querySelector('img')!;
    icon.setAttribute('src', 'data:image/png,broken');
    await act(async () => { icon.dispatchEvent(new Event('error')); });
    expect(icon.getAttribute('src')).toBe('/wallets/metamask.svg');
    await act(async () => { metamaskButton.dispatchEvent(new MouseEvent('click', {bubbles: true})); });
    expect(mockSelect).toHaveBeenCalledExactlyOnceWith(providers[0]);
  });

  it('renders PublicLookup and executes lookup by case ID', async () => {
    const mockCase: CaseRecord = {
      case_id: 'REAL-000001',
      client_nonce: 'nonce-1',
      title: 14,
      part: '71',
      section: '71.1',
      activity_date: '2025-10-01',
      standard_designation_hint: 'FAA Order JO 7400.11',
      state: 'LOCKED',
      owner: '0x1111111111111111111111111111111111111111',
      fingerprint: '0xabc',
      current_assessment_id: 'REAL-000001-A01',
      attempt_count: 1,
      last_attempt_epoch: 1759276800,
      last_attempt_at: '2025-10-01T00:05:00Z',
      successor_case_id: '',
      predecessor_case_id: '',
      created_at: '2025-10-01T00:00:00Z',
      frozen_at: '2025-10-01T00:01:00Z',
    };

    vi.spyOn(contractService, 'getCase').mockResolvedValue(mockCase);
    vi.spyOn(contractService, 'getApplicableBaseline').mockResolvedValue({
      assessment_id: 'REAL-000001-A01',
      case_id: 'REAL-000001',
      attempt_number: 1,
      schema_version: '1.0.0',
      outcome: 'EDITION_APPLIES',
      standard_body: 'FAA',
      designation_family: 'FAA Order JO 7400.11',
      edition: 'FAA Order JO 7400.11J',
      effective_from: '2025-09-15',
      effective_to: '',
      ecfr_date: '2025-10-01',
      ecfr_section_fingerprint: '0x123',
      reason_code: 'ANNUAL_EDITION_APPLIES',
      authority_documents: [],
      source_statuses: {},
      observed_at: '2025-10-01T00:05:00Z',
    });

    const mockSelect = vi.fn();

    await act(async () => {
      root?.render(<PublicLookup selectedCaseId="REAL-000001" onSelectCase={mockSelect} />);
    });

    expect(container?.textContent).toContain('Public Regulatory Evidence Lookup');
  });

  it('renders OwnerWorkbench with case creation and freeze triggers', async () => {
    const mockWallet = {
      connected: true,
      address: '0x1111111111111111111111111111111111111111',
      chainId: 61999,
      provider: { request: vi.fn() } as any,
      providerName: 'MetaMask',
      isCorrectChain: true,
    };

    const mockTxStart = vi.fn();
    const mockCaseCreated = vi.fn();
    const mockRefresh = vi.fn();

    await act(async () => {
      root?.render(
        <OwnerWorkbench
          walletState={mockWallet}
          activeCase={null}
          onTxStart={mockTxStart}
          onCaseCreated={mockCaseCreated}
          onRefreshActiveCase={mockRefresh}
        />
      );
    });

    expect(container?.textContent).toContain('Case Creator & Lifecycle Workbench');
    expect(container?.textContent).toContain('Target Activity Date');
  });

  it('renders ResolverWorkbench with consensus execution trigger', async () => {
    const mockWallet = {
      connected: true,
      address: '0x1111111111111111111111111111111111111111',
      chainId: 61999,
      provider: { request: vi.fn() } as any,
      providerName: 'MetaMask',
      isCorrectChain: true,
    };

    const frozenCase: CaseRecord = {
      case_id: 'REAL-000001',
      client_nonce: 'nonce-1',
      title: 14,
      part: '71',
      section: '71.1',
      activity_date: '2025-10-01',
      standard_designation_hint: 'FAA Order JO 7400.11',
      state: 'FROZEN',
      owner: '0x1111111111111111111111111111111111111111',
      fingerprint: '0xabc',
      current_assessment_id: '',
      attempt_count: 0,
      last_attempt_epoch: 0,
      last_attempt_at: '',
      successor_case_id: '',
      predecessor_case_id: '',
      created_at: '2025-10-01T00:00:00Z',
      frozen_at: '2025-10-01T00:01:00Z',
    };

    const mockTxStart = vi.fn();
    const mockRefresh = vi.fn();

    await act(async () => {
      root?.render(
        <ResolverWorkbench
          walletState={mockWallet}
          activeCase={frozenCase}
          onTxStart={mockTxStart}
          onRefreshActiveCase={mockRefresh}
        />
      );
    });

    expect(container?.textContent).toContain('Permissionless Resolver Workbench');
    expect(container?.textContent).toContain('Execute Validator Assessment');
  });

  it('renders IntegratorWorkbench with explicit binding and no-op guidance', async () => {
    const mockWallet = {
      connected: true,
      address: '0x1111111111111111111111111111111111111111',
      chainId: 61999,
      provider: { request: vi.fn() } as any,
      providerName: 'MetaMask',
      isCorrectChain: true,
    };

    const lockedCase: CaseRecord = {
      case_id: 'REAL-000001',
      client_nonce: 'nonce-1',
      title: 14,
      part: '71',
      section: '71.1',
      activity_date: '2025-10-01',
      standard_designation_hint: 'FAA Order JO 7400.11',
      state: 'LOCKED',
      owner: '0x1111111111111111111111111111111111111111',
      fingerprint: '0xabc',
      current_assessment_id: 'REAL-000001-A01',
      attempt_count: 1,
      last_attempt_epoch: 1759276800,
      last_attempt_at: '2025-10-01T00:05:00Z',
      successor_case_id: '',
      predecessor_case_id: '',
      created_at: '2025-10-01T00:00:00Z',
      frozen_at: '2025-10-01T00:01:00Z',
    };

    const mockTxStart = vi.fn();

    await act(async () => {
      root?.render(
        <IntegratorWorkbench
          walletState={mockWallet}
          activeCase={lockedCase}
          onTxStart={mockTxStart}
        />
      );
    });

    expect(container?.textContent).toContain('Downstream Checklist Integrator Workbench');
    expect(container?.textContent).toContain('Bind / Advance Integration Namespace');
    expect(container?.textContent).toContain('same still-LOCKED case changes nothing');
    expect(container?.textContent).toContain('NOT_APPLICABLE cases cannot be bound');
    expect(container?.textContent).toContain('supersession never advances a checklist automatically');
    expect(container?.querySelector('label[for="integration-target-case"]')).not.toBeNull();
  });

  it('renders SuccessorWizard with predecessor linkage', async () => {
    const mockWallet = {
      connected: true,
      address: '0x1111111111111111111111111111111111111111',
      chainId: 61999,
      provider: { request: vi.fn() } as any,
      providerName: 'MetaMask',
      isCorrectChain: true,
    };

    const lockedCase: CaseRecord = {
      case_id: 'REAL-000001',
      client_nonce: 'nonce-1',
      title: 14,
      part: '71',
      section: '71.1',
      activity_date: '2024-10-01',
      standard_designation_hint: 'FAA Order JO 7400.11',
      state: 'LOCKED',
      owner: '0x1111111111111111111111111111111111111111',
      fingerprint: '0xabc',
      current_assessment_id: 'REAL-000001-A01',
      attempt_count: 1,
      last_attempt_epoch: 1759276800,
      last_attempt_at: '2024-10-01T00:05:00Z',
      successor_case_id: '',
      predecessor_case_id: '',
      created_at: '2024-10-01T00:00:00Z',
      frozen_at: '2024-10-01T00:01:00Z',
    };

    const mockTxStart = vi.fn();
    const mockSuccessorCreated = vi.fn();

    await act(async () => {
      root?.render(
        <SuccessorWizard
          walletState={mockWallet}
          predecessorCase={lockedCase}
          onTxStart={mockTxStart}
          onSuccessorCreated={mockSuccessorCreated}
        />
      );
    });

    expect(container?.textContent).toContain('Successor Lineage Proposal Wizard');
    expect(container?.textContent).toContain('Predecessor Case ID');
    expect(container?.textContent).toContain('DRAFT, FROZEN or UNRESOLVED');
    expect(container?.textContent).toContain('only after the successor reaches LOCKED or NOT_APPLICABLE');
    expect(container?.textContent).toContain('Checklist bindings never advance automatically');
    const inputEl = container?.querySelector('input[disabled]') as HTMLInputElement;
    expect(inputEl?.value).toBe('REAL-000001');
  });

  it('renders AuditorView and queries contract events', async () => {
    vi.spyOn(contractService, 'getEvents').mockResolvedValue({
      events: [
        {
          event_id: 'evt-1',
          event_type: 'CASE_CREATED',
          subject_id: 'REAL-000001',
          actor: '0x1111111111111111111111111111111111111111',
          timestamp: '2025-10-01T00:00:00Z',
        },
      ],
      total: 1,
      offset: 0,
      limit: 20,
    });
    vi.spyOn(contractService, 'getUpgrader').mockResolvedValue('0xdeployer');

    await act(async () => {
      root?.render(<AuditorView />);
    });

    expect(container?.textContent).toContain('Auditor & Regulatory Observer Hub');
    expect(container?.textContent).toContain('append-only on-chain event log');
    expect(container?.textContent).toContain('Filter Current Page:');
    const eventFilterValues = Array.from(container?.querySelectorAll('#filter-topic option') || []).map(
      (option) => (option as HTMLOptionElement).value
    );
    expect(eventFilterValues).toEqual([
      'ALL',
      'CASE_CREATED',
      'CASE_FROZEN',
      'CASE_ASSESSED',
      'CASE_RETRY_RESERVED',
      'SUCCESSOR_CREATED',
      'CASE_SUPERSEDED_BY_SUCCESSOR',
      'INTEGRATION_BOUND',
      'INTEGRATION_ADVANCED',
    ]);
    expect(container?.querySelector('.badge-NOT_APPLICABLE')).toBeNull();
  });

  it('renders App shell and navigates between tabs', async () => {
    await act(async () => {
      root?.render(<App />);
    });

    expect(container?.textContent).toContain('RuleSeal');
    expect(container?.textContent).toContain('Public Evidence Lookup');
    const tabs = Array.from(container?.querySelectorAll('[role="tab"]') || []);
    expect(tabs).toHaveLength(6);
    expect(tabs.every((tab) => Boolean(document.getElementById(tab.getAttribute('aria-controls') || '')))).toBe(true);
    expect(container?.querySelectorAll('[role="tabpanel"]')).toHaveLength(6);
    expect(container?.querySelectorAll('[role="tabpanel"]:not([hidden])')).toHaveLength(1);

    // Click on Case Creator tab
    const creatorTab = Array.from(container?.querySelectorAll('button') || []).find(
      (b) => b.textContent?.includes('Case Creator')
    );
    expect(creatorTab).toBeDefined();

    await act(async () => {
      creatorTab?.click();
    });

    expect(container?.textContent).toContain('Case Creator & Lifecycle Workbench');
    expect(document.getElementById('panel-creator')?.hidden).toBe(false);
    expect(document.getElementById('panel-lookup')?.hidden).toBe(true);
  });
});
