import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { journalService } from '../services/journalService.ts';
import { sharedRpc } from '../services/rpcClient.ts';
import { PendingOperation } from '../types/domain.ts';

describe('JournalService (Restart-Safe Write Pipeline & Reconciliation)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    journalService.releaseWriteLock('op-123');
    journalService.releaseWriteLock('op-456');
    journalService.releaseWriteLock('op-789');
    journalService.releaseWriteLock('op-lock-1');
    journalService.releaseWriteLock('op-lock-2');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('runs storage capability probe successfully when storage is working', () => {
    const isAvailable = journalService.probeStorage();
    expect(isAvailable).toBe(true);
  });

  it('fails closed when storage capability probe fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const isAvailable = journalService.probeStorage();
    expect(isAvailable).toBe(false);

    const op: PendingOperation = {
      id: 'op-fail-1',
      type: 'create_case',
      timestamp: Date.now(),
      params: {},
      status: 'PRE_SIGN',
    };

    expect(() => journalService.savePendingOperation(op)).toThrow('STORAGE_CAPABILITY_PROBE_FAILED');
  });

  it('saves and retrieves pending operations', () => {
    const op: PendingOperation = {
      id: 'op-123',
      type: 'create_case',
      timestamp: Date.now(),
      params: { nonce: 'nonce-1' },
      status: 'PRE_SIGN',
    };

    journalService.savePendingOperation(op);

    const list = journalService.getPendingOperations();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('op-123');
    expect(list[0].type).toBe('create_case');
    expect(list[0].status).toBe('PRE_SIGN');
  });

  it('enforces volatile single-flight write lock against overlapping operations', () => {
    const op1: PendingOperation = {
      id: 'op-lock-1',
      type: 'create_case',
      timestamp: Date.now(),
      params: {},
      status: 'PRE_SIGN',
    };
    const op2: PendingOperation = {
      id: 'op-lock-2',
      type: 'freeze_case',
      timestamp: Date.now(),
      params: {},
      status: 'PRE_SIGN',
    };

    journalService.savePendingOperation(op1);
    expect(() => journalService.savePendingOperation(op2)).toThrow('CONCURRENT_WRITE_LOCKED');

    journalService.removeOperation('op-lock-1');
    expect(() => journalService.savePendingOperation(op2)).not.toThrow();
  });

  it('updates operation with broadcast transaction hash and status', () => {
    const op: PendingOperation = {
      id: 'op-456',
      type: 'freeze_case',
      timestamp: Date.now(),
      params: { caseId: 'REAL-000001' },
      status: 'PRE_SIGN',
    };

    journalService.savePendingOperation(op);
    journalService.updateHash('op-456', '0xabcdef123456');

    const list = journalService.getPendingOperations();
    expect(list[0].status).toBe('SUBMITTED');
    expect(list[0].txHash).toBe('0xabcdef123456');
  });

  it('removes completed operation from persistent storage', () => {
    const op: PendingOperation = {
      id: 'op-789',
      type: 'assess_case',
      timestamp: Date.now(),
      params: { caseId: 'REAL-000001' },
      status: 'PRE_SIGN',
    };

    journalService.savePendingOperation(op);
    expect(journalService.getPendingOperations().length).toBe(1);

    journalService.removeOperation('op-789');
    expect(journalService.getPendingOperations().length).toBe(0);
  });

  it('reconciles pending operations on reload against RPC receipts', async () => {
    const finalizedOp: PendingOperation = {
      id: 'op-fin',
      type: 'freeze_case',
      timestamp: Date.now(),
      params: { caseId: 'REAL-000001' },
      status: 'SUBMITTED',
      txHash: '0xfin123',
    };
    const failedOp: PendingOperation = {
      id: 'op-fail',
      type: 'assess_case',
      timestamp: Date.now(),
      params: { caseId: 'REAL-000002' },
      status: 'SUBMITTED',
      txHash: '0xfail123',
    };
    const pendingOp: PendingOperation = {
      id: 'op-pending',
      type: 'create_case',
      timestamp: Date.now(),
      params: { nonce: 'nonce-p' },
      status: 'SUBMITTED',
      txHash: '0xpending123',
    };

    journalService.savePendingOperation(finalizedOp);
    journalService.releaseWriteLock('op-fin');
    journalService.savePendingOperation(failedOp);
    journalService.releaseWriteLock('op-fail');
    journalService.savePendingOperation(pendingOp);
    journalService.releaseWriteLock('op-pending');

    const rawClient = sharedRpc.getRawClient();
    vi.spyOn(rawClient, 'getTransactionReceipt').mockImplementation(async ({ hash }: any) => {
      if (hash === '0xfin123') {
        return {
          status: 'FINALIZED',
          execution_result: 'FINISHED_WITH_RETURN',
          result: 1,
        };
      }
      if (hash === '0xfail123') {
        return {
          status: 'FINALIZED',
          execution_result: 'FINISHED_WITH_ERROR',
          error: 'CASE_NOT_FROZEN',
        };
      }
      if (hash === '0xpending123') {
        return {
          status: 'ACCEPTED',
        };
      }
      return null;
    });

    const result = await journalService.reconcilePendingOperations(undefined, async (op) => op.id === 'op-fin');
    expect(result.finalized).toContain('op-fin');
    expect(result.failed).toContain('op-fail');
    expect(result.stillPending).toContain('op-pending');

    const remaining = journalService.getPendingOperations();
    // Finalized op was purged
    expect(remaining.some((o) => o.id === 'op-fin')).toBe(false);
    // Confirmed terminal failure is safe to remove and retry.
    expect(remaining.some((o) => o.id === 'op-fail')).toBe(false);
    // Pending op remains
    expect(remaining.some((o) => o.id === 'op-pending')).toBe(true);
  });
});
