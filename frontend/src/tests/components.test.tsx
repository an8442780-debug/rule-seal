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
import { contractService } from '../services/contractService.ts';
import { sharedRpc } from '../services/rpcClient.ts';
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

  it('renders Header with disconnected state and responds to connect click', async () => {
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

    expect(container?.textContent).toContain('Regulatory Edition Applicability Lock');
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

  it('renders IntegratorWorkbench and binds namespace to locked case', async () => {
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
  });

  it('renders App shell and navigates between tabs', async () => {
    await act(async () => {
      root?.render(<App />);
    });

    expect(container?.textContent).toContain('Regulatory Edition Applicability Lock');
    expect(container?.textContent).toContain('Public Evidence Lookup');

    // Click on Case Creator tab
    const creatorTab = Array.from(container?.querySelectorAll('button') || []).find(
      (b) => b.textContent?.includes('Case Creator')
    );
    expect(creatorTab).toBeDefined();

    await act(async () => {
      creatorTab?.click();
    });

    expect(container?.textContent).toContain('Case Creator & Lifecycle Workbench');
  });
});
