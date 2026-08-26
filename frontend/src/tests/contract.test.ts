import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { contractService } from '../services/contractService.ts';
import { sharedRpc } from '../services/rpcClient.ts';
import { walletService } from '../services/walletService.ts';

describe('ContractService (Domain Client, Write Routing & Receipt Classifier)', () => {
  beforeEach(() => {
    sharedRpc.clearCache();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    vi.spyOn(walletService, 'getState').mockReturnValue({
      connected: true,
      address: mockAddress,
      chainId: 61999,
      provider: mockProvider as any,
      providerName: 'OKX Wallet',
      isCorrectChain: true,
    });

    const mockWriteContract = vi.fn().mockResolvedValue('0xtxhash123');
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
    } as any);

    const res = await contractService.createCase('nonce-test-write', '71', '71.1', '2025-10-01', 'FAA Order JO 7400.11');

    expect(createClientSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        account: mockAddress,
        provider: mockProvider,
      })
    );
    expect(res.txHash).toBe('0xtxhash123');
    expect(res.caseId).toBe('REAL-000001');
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
