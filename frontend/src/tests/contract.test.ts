import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { contractService } from '../services/contractService.ts';
import { sharedRpc } from '../services/rpcClient.ts';
import { walletService } from '../services/walletService.ts';
import { journalService } from '../services/journalService.ts';
import type { TxStep } from '../types/domain.ts';

describe('ContractService (Domain Client, Write Routing & Receipt Classifier)', () => {
  beforeEach(() => {
    sharedRpc.clearCache();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    for (const op of journalService.getPendingOperations()) journalService.removeOperation(op.id);
  });

  const hash = `0x${'c'.repeat(64)}`;
  const sender = `0x${'2'.repeat(40)}`;
  function setupWrite(submit = vi.fn().mockResolvedValue(hash)) {
    const provider = { request: vi.fn() };
    vi.spyOn(walletService, 'getWalletState').mockReturnValue({ phase: 'CONNECTED', connected: true,
      address: sender, chainId: 61999, provider, providerName: 'OKX Wallet', isCorrectChain: true,
      error: null, writeClientBinding: { provider, address: sender } });
    vi.spyOn(contractService, 'getConfiguredContractAddress').mockReturnValue(`0x${'3'.repeat(40)}`);
    vi.spyOn(contractService, 'createWriteClient').mockReturnValue({ writeContract: submit } as any);
    vi.spyOn(sharedRpc, 'getTransactionOutcome').mockResolvedValue({ transaction: {}, status: 'FINALIZED', execution: 'FINISHED_WITH_RETURN' });
    vi.spyOn(contractService, 'getCaseByNonce').mockResolvedValue({ case_id: 'test-case', state: 'DRAFT', owner: sender,
      client_nonce: 'nonce', part: '71', section: '71.1', activity_date: '2025-10-01', standard_designation_hint: 'FAA Order JO 7400.11' } as any);
    return submit;
  }
  const create = (progress?: (step: TxStep, detail?: any) => void) => contractService.createCase('nonce', '71', '71.1', '2025-10-01', 'FAA Order JO 7400.11', progress);

  it('emits evidence-driven phases and reads back using the submitted sender after an account change', async () => {
    const submit = setupWrite();
    const phases: TxStep[] = [];
    await create((step) => {
      phases.push(step);
      if (step === 'SUBMITTED') {
        const current = walletService.getWalletState();
        vi.mocked(walletService.getWalletState).mockReturnValue({ ...current,
          address: `0x${'4'.repeat(40)}`,
          writeClientBinding: { provider: current.provider, address: `0x${'4'.repeat(40)}` } });
      }
    });
    expect(phases).toEqual(['WAITING_FOR_WALLET', 'SUBMITTED', 'WAITING_FOR_FINALITY', 'VERIFYING_EXECUTION', 'VERIFYING_READBACK', 'SUCCESS']);
    expect(contractService.getCaseByNonce).toHaveBeenCalledWith(sender, 'nonce', true);
    expect(submit).toHaveBeenCalledOnce();
    expect(journalService.getPendingOperations()).toEqual([]);
  });

  it('releases only an explicit wallet rejection and emits REJECTED', async () => {
    const submit = setupWrite(vi.fn().mockRejectedValue(Object.assign(new Error('declined'), { code: 4001 })));
    const progress = vi.fn();
    await expect(create(progress)).rejects.toThrow('declined');
    expect(progress).toHaveBeenLastCalledWith('REJECTED', expect.any(Object));
    expect(journalService.getPendingOperations()).toEqual([]);
    expect(submit).toHaveBeenCalledOnce();
  });

  it.each(['transport', 'invalid hash'])('preserves pre-hash uncertainty: %s', async (fault) => {
    const submit = setupWrite(fault === 'transport' ? vi.fn().mockRejectedValue(new Error('transport')) : vi.fn().mockResolvedValue('invalid'));
    const progress = vi.fn();
    await expect(create(progress)).rejects.toThrow();
    expect(progress).toHaveBeenLastCalledWith('RECONCILIATION_REQUIRED', expect.any(Object));
    expect(journalService.getPendingOperations()).toHaveLength(1);
    await expect(create()).rejects.toThrow('CONCURRENT_WRITE_LOCKED');
    expect(submit).toHaveBeenCalledOnce();
    expect(sharedRpc.getTransactionOutcome).not.toHaveBeenCalled();
  });

  it('preserves the visible hash on readback failure and never announces SUCCESS', async () => {
    const submit = setupWrite();
    vi.mocked(contractService.getCaseByNonce).mockRejectedValue(new Error('unavailable'));
    const progress = vi.fn();
    await expect(create(progress)).rejects.toThrow('AUTHORITATIVE_READBACK_FAILED');
    expect(progress).toHaveBeenLastCalledWith('RECONCILIATION_REQUIRED', expect.objectContaining({ txHash: hash }));
    expect(progress.mock.calls.some(([phase]) => phase === 'SUCCESS')).toBe(false);
    expect(journalService.getPendingOperations()[0]).toMatchObject({ txHash: hash, sender, chainId: 61999 });
    expect(submit).toHaveBeenCalledOnce();
  });

  it('retains unknown execution without performing a readback', async () => {
    setupWrite();
    vi.mocked(sharedRpc.getTransactionOutcome).mockResolvedValue({ transaction: {}, status: 'FINALIZED', execution: '' });
    const progress = vi.fn();
    await expect(create(progress)).rejects.toThrow('TRANSACTION_UNKNOWN_EXECUTION_RESULT');
    expect(progress).toHaveBeenLastCalledWith('RECONCILIATION_REQUIRED', expect.objectContaining({ txHash: hash }));
    expect(journalService.getPendingOperations()).toHaveLength(1);
    expect(contractService.getCaseByNonce).not.toHaveBeenCalled();
  });

  it('unlocks a proven finalized execution failure and retains its visible hash', async () => {
    setupWrite();
    vi.mocked(sharedRpc.getTransactionOutcome).mockResolvedValue({ transaction: { error: 'CASE_NOT_FROZEN' }, status: 'FINALIZED', execution: 'FINISHED_WITH_ERROR' });
    const progress = vi.fn();
    await expect(create(progress)).rejects.toThrow('TRANSACTION_EXECUTION_FAILED');
    expect(progress).toHaveBeenLastCalledWith('FAILED', expect.objectContaining({ txHash: hash }));
    expect(journalService.getPendingOperations()).toEqual([]);
    expect(contractService.getCaseByNonce).not.toHaveBeenCalled();
  });

  it('keeps a hash visible and volatile when storage fails after wallet submission', async () => {
    setupWrite(vi.fn().mockImplementation(async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
      return hash;
    }));
    const progress = vi.fn();
    await expect(create(progress)).rejects.toThrow('AUTHORITATIVE_READBACK_FAILED');
    expect(progress).toHaveBeenCalledWith('SUBMITTED', { txHash: hash, persistenceDegraded: true });
    expect(progress).toHaveBeenLastCalledWith('RECONCILIATION_REQUIRED', expect.objectContaining({ txHash: hash, persistenceDegraded: true }));
    expect(journalService.getPendingOperations()[0].txHash).toBe(hash);
  });

  it('enforces 24 polls without resubmitting', async () => {
    vi.useFakeTimers();
    const read = vi.spyOn(sharedRpc, 'getTransactionOutcome').mockResolvedValue({ transaction: {}, status: 'ACCEPTED', execution: '' });
    const result = expect(contractService.waitForFinalizedTransaction(hash)).rejects.toThrow('TRANSACTION_TIMEOUT_DEADLINE_EXCEEDED');
    await vi.runAllTimersAsync();
    await result;
    expect(read).toHaveBeenCalledTimes(24);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    ['case_id', ''], ['owner', `0x${'9'.repeat(40)}`], ['client_nonce', 'other'],
    ['part', '72'], ['section', '71.2'], ['activity_date', '2025-10-02'], ['state', 'UNKNOWN'],
  ])('rejects mismatched creation readback field %s in foreground and recovery', async (field, value) => {
    setupWrite();
    const correct = await contractService.getCaseByNonce(sender, 'nonce', true);
    vi.mocked(contractService.getCaseByNonce).mockResolvedValue({ ...correct, [field]: value });
    const progress = vi.fn();
    await expect(create(progress)).rejects.toThrow('READBACK_MISMATCH');
    const pending = journalService.getPendingOperations()[0];
    expect(pending.txHash).toBe(hash);
    await expect(contractService.verifyPendingOperation(pending)).resolves.toBe(false);
    expect(progress).toHaveBeenLastCalledWith('RECONCILIATION_REQUIRED', expect.objectContaining({ txHash: hash }));
  });

  it('refuses recovery under a different chain or contract without reading state', async () => {
    setupWrite();
    const base = { id: 'test', type: 'create_case', timestamp: Date.now(), status: 'SUBMITTED' as const,
      sender, chainId: 61999, contractAddress: `0x${'3'.repeat(40)}`, params: { clientNonce: 'nonce' }, txHash: hash };
    await expect(contractService.verifyPendingOperation({ ...base, chainId: 1 })).resolves.toBe(false);
    await expect(contractService.verifyPendingOperation({ ...base, contractAddress: `0x${'5'.repeat(40)}` })).resolves.toBe(false);
    expect(contractService.getCaseByNonce).not.toHaveBeenCalled();
  });

  it('ends a hidden-tab wait at the deadline with no RPC and cleans the listener', async () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const remove = vi.spyOn(document, 'removeEventListener');
    const read = vi.spyOn(sharedRpc, 'getTransactionOutcome');
    const result = expect(contractService.waitForFinalizedTransaction(hash, 1000)).rejects.toThrow('TRANSACTION_TIMEOUT_DEADLINE_EXCEEDED');
    await vi.advanceTimersByTimeAsync(1000);
    await result;
    expect(read).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reads and parses case details from RPC', async () => {
    const mockCase = {
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

    vi.spyOn(sharedRpc, 'readContract').mockResolvedValue(JSON.stringify(mockCase));

    const result = await contractService.getCase('REAL-000001', true);
    expect(result.case_id).toBe('REAL-000001');
    expect(result.state).toBe('LOCKED');
    expect(result.activity_date).toBe('2025-10-01');
  });

  it('reads and parses assessment details and authority documents', async () => {
    const mockAssessment = {
      assessment_id: 'REAL-000001-A01',
      case_id: 'REAL-000001',
      attempt_number: 1,
      schema_version: '1.0.0',
      outcome: 'EDITION_APPLIES',
      standard_body: 'Federal Aviation Administration',
      designation_family: 'FAA Order JO 7400.11',
      edition: 'FAA Order JO 7400.11J',
      effective_from: '2025-09-15',
      effective_to: '2026-09-15',
      ecfr_date: '2025-10-01',
      ecfr_section_fingerprint: '0xecfrfingerprint',
      reason_code: 'ACTIVE_EDITION_EFFECTIVE_FOR_ACTIVITY_DATE',
      authority_documents: [
        {
          document_number: '2025-16493',
          publication_date: '2025-08-20',
          effective_on: '2025-09-15',
          canonical_url: 'https://www.federalregister.gov/documents/2025/08/20/2025-16493/amendment-of-part-71',
        },
      ],
      source_statuses: {
        'eCFR Title 14 Part 71 XML': 'ACCESSIBLE',
        'Federal Register API Part 71': 'ACCESSIBLE',
      },
      observed_at: '2025-10-01T00:05:00Z',
    };

    vi.spyOn(sharedRpc, 'readContract').mockResolvedValue(JSON.stringify(mockAssessment));

    const result = await contractService.getAssessment('REAL-000001-A01', true);
    expect(result.outcome).toBe('EDITION_APPLIES');
    expect(result.edition).toBe('FAA Order JO 7400.11J');
    expect(result.authority_documents.length).toBe(1);
    expect(result.authority_documents[0].document_number).toBe('2025-16493');
  });

  it('reads integration details correctly', async () => {
    const mockIntegration = {
      caller: '0x1111111111111111111111111111111111111111',
      namespace: 'compliance-checklist',
      case_id: 'REAL-000001',
      previous_case_id: '',
      state: 'ACTIVE',
      registered_at: '2025-10-01T00:05:00Z',
      updated_at: '2025-10-01T00:10:00Z',
    };

    vi.spyOn(sharedRpc, 'readContract').mockResolvedValue(JSON.stringify(mockIntegration));

    const result = await contractService.getIntegration('0x1111111111111111111111111111111111111111', 'compliance-checklist', true);
    expect(result.case_id).toBe('REAL-000001');
    expect(result.state).toBe('ACTIVE');
  });

  it('passes exact selected provider and account to createClient on write', async () => {
    const mockProvider = { request: vi.fn(), on: vi.fn(), removeListener: vi.fn() };
    const mockAddress = '0x2222222222222222222222222222222222222222';

    vi.spyOn(walletService, 'getWalletState').mockReturnValue({
      phase: 'CONNECTED',
      connected: true,
      address: mockAddress,
      chainId: 61999,
      provider: mockProvider as any,
      providerName: 'OKX Wallet',
      isCorrectChain: true,
      error: null,
      writeClientBinding: { provider: mockProvider, address: mockAddress },
    } as any);

    const transactionHash = `0x${'a'.repeat(64)}`;
    const mockWriteContract = vi.fn().mockResolvedValue(transactionHash);
    const createClientSpy = vi.spyOn(contractService, 'createWriteClient').mockReturnValue({
      writeContract: mockWriteContract,
    } as any);
    vi.spyOn(contractService, 'getConfiguredContractAddress').mockReturnValue(
      '0x3333333333333333333333333333333333333333'
    );

    // Mock receipt polling
    const rawClient = sharedRpc.getRawClient();
    vi.spyOn(rawClient, 'getTransaction').mockResolvedValue({
      statusName: 'FINALIZED',
      txExecutionResultName: 'FINISHED_WITH_RETURN',
      result: 1,
    });

    // Mock authoritative readback
    vi.spyOn(contractService, 'getCaseByNonce').mockResolvedValue({
      case_id: 'REAL-000001',
      state: 'DRAFT',
      owner: mockAddress, client_nonce: 'nonce-test-write', part: '71', section: '71.1',
      activity_date: '2025-10-01', standard_designation_hint: 'FAA Order JO 7400.11',
    } as any);

    const res = await contractService.createCase('nonce-test-write', '71', '71.1', '2025-10-01', 'FAA Order JO 7400.11');

    expect(createClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        account: mockAddress,
        provider: mockProvider,
      })
    );
    expect(res.txHash).toBe(transactionHash);
    expect(res.caseId).toBe('REAL-000001');
  });

  it('aborts before journal or write when account removal occurs during chain switching', async () => {
    const staleProvider = { request: vi.fn() };
    const staleAddress = `0x${'5'.repeat(40)}`;
    vi.spyOn(walletService, 'getWalletState')
      .mockReturnValueOnce({ phase: 'WRONG_CHAIN', connected: true, address: staleAddress,
        chainId: 1, provider: staleProvider, providerName: 'OKX Wallet', isCorrectChain: false,
        error: null, writeClientBinding: null } as any)
      .mockReturnValue({ phase: 'DISCONNECTED', connected: false, address: null,
        chainId: null, provider: null, providerName: null, isCorrectChain: false,
        error: null, writeClientBinding: null } as any);
    vi.spyOn(walletService, 'switchChain').mockResolvedValue();
    vi.spyOn(contractService, 'getConfiguredContractAddress').mockReturnValue(`0x${'3'.repeat(40)}`);
    const createClientSpy = vi.spyOn(contractService, 'createWriteClient');

    await expect(create()).rejects.toThrow('WALLET_WRITE_BINDING_UNAVAILABLE');
    expect(createClientSpy).not.toHaveBeenCalled();
    expect(journalService.getPendingOperations()).toEqual([]);
  });

  it('treats ACCEPTED receipt status as pending and waits until FINALIZED', async () => {
    const rawClient = sharedRpc.getRawClient();
    let pollCount = 0;

    vi.spyOn(rawClient, 'getTransaction').mockImplementation(async () => {
      pollCount++;
      if (pollCount === 1) {
        return { statusName: 'ACCEPTED' }; // not finalized yet!
      }
      return {
        statusName: 'FINALIZED',
        txExecutionResultName: 'FINISHED_WITH_RETURN',
      };
    });

    const receipt = await contractService.waitForFinalizedTransaction('0xaccepted-then-finalized');
    expect(receipt.statusName).toBe('FINALIZED');
    expect(pollCount).toBe(2);
  });

  it('throws TRANSACTION_EXECUTION_FAILED on FINISHED_WITH_ERROR with BigInt safe error handling', async () => {
    const rawClient = sharedRpc.getRawClient();

    vi.spyOn(rawClient, 'getTransaction').mockResolvedValue({
      statusName: 'FINALIZED',
      txExecutionResultName: 'FINISHED_WITH_ERROR',
      error: 'DUPLICATE_CLIENT_NONCE',
      data: { code: 123n }, // Contains BigInt
    });

    await expect(
      contractService.waitForFinalizedTransaction('0xreverted-tx')
    ).rejects.toThrow('TRANSACTION_EXECUTION_FAILED');
  });

  it('throws TRANSACTION_UNKNOWN_EXECUTION_RESULT if execution_result is missing on FINALIZED receipt', async () => {
    const rawClient = sharedRpc.getRawClient();

    vi.spyOn(rawClient, 'getTransaction').mockResolvedValue({
      statusName: 'FINALIZED',
      // No execution_result or result
    });

    await expect(
      contractService.waitForFinalizedTransaction('0xunknown-exec')
    ).rejects.toThrow('TRANSACTION_UNKNOWN_EXECUTION_RESULT');
  });

  it('accepts the current Studionet leader-receipt return shape', async () => {
    const rawClient = sharedRpc.getRawClient();
    vi.spyOn(rawClient, 'getTransaction').mockResolvedValue({
      statusName: 'FINALIZED',
      consensus_data: {
        leader_receipt: [{ mode: 'leader', execution_result: 'SUCCESS', result: { status: 'return' } }],
      },
    });

    await expect(contractService.waitForFinalizedTransaction('0xstudio-shape')).resolves.toMatchObject({
      statusName: 'FINALIZED',
    });
  });
});
