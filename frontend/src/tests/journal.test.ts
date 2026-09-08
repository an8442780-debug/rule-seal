import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JournalService, JOURNAL_STORAGE_KEY } from '../services/journalService.ts';
import { sharedRpc } from '../services/rpcClient.ts';
import { PendingOperation } from '../types/domain.ts';

describe('JournalService (Restart-Safe Write Pipeline & Reconciliation)', () => {
  let journalService: JournalService;
  const hash = `0x${'a'.repeat(64)}`;
  const operation = (): PendingOperation => ({ id: 'reserved', type: 'create_case', timestamp: Date.now(), params: {}, status: 'PRE_SIGN' });
  beforeEach(() => {
    vi.restoreAllMocks();
    journalService = new JournalService();
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
    journalService.updateHash('op-456', hash);

    const list = journalService.getPendingOperations();
    expect(list[0].status).toBe('SUBMITTED');
    expect(list[0].txHash).toBe(hash);
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
      txHash: `0x${'1'.repeat(64)}`,
    };
    const failedOp: PendingOperation = {
      id: 'op-fail',
      type: 'assess_case',
      timestamp: Date.now(),
      params: { caseId: 'REAL-000002' },
      status: 'SUBMITTED',
      txHash: `0x${'2'.repeat(64)}`,
    };
    const pendingOp: PendingOperation = {
      id: 'op-pending',
      type: 'create_case',
      timestamp: Date.now(),
      params: { nonce: 'nonce-p' },
      status: 'SUBMITTED',
      txHash: `0x${'3'.repeat(64)}`,
    };

    // Imported recovery fixtures, not three authorized concurrent submissions.
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify([finalizedOp, failedOp, pendingOp]));

    const rawClient = sharedRpc.getRawClient();
    vi.spyOn(rawClient, 'getTransaction').mockImplementation(async ({ hash }: any) => {
      if (hash === finalizedOp.txHash) {
        return {
          statusName: 'FINALIZED',
          txExecutionResultName: 'FINISHED_WITH_RETURN',
          result: 1,
        };
      }
      if (hash === failedOp.txHash) {
        return {
          statusName: 'FINALIZED',
          txExecutionResultName: 'FINISHED_WITH_ERROR',
          error: 'CASE_NOT_FROZEN',
        };
      }
      if (hash === pendingOp.txHash) {
        return {
          statusName: 'ACCEPTED',
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

  it('uses only the configured RuleSeal journal key', () => {
    sessionStorage.setItem('real_pending_ops_v1', JSON.stringify([operation()]));
    expect(journalService.getPendingOperations()).toEqual([]);
  });

  it('retains an unknown pre-hash operation across reload and blocks another write with zero RPC', async () => {
    journalService.savePendingOperation(operation());
    const reloaded = new JournalService();
    const rpc = vi.spyOn(sharedRpc, 'getTransactionOutcome');
    const result = await reloaded.reconcilePendingOperations();
    expect(result.stillPending).toEqual(['reserved']);
    expect(result.failed).toEqual([]);
    expect(reloaded.getPendingOperations()).toHaveLength(1);
    expect(() => reloaded.savePendingOperation({ ...operation(), id: 'second' })).toThrow('CONCURRENT_WRITE_LOCKED');
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each(['{broken', '{}', '[{}]', '[{"id":"x"}]'])('fails closed on malformed recovery data: %s', (raw) => {
    localStorage.setItem(JOURNAL_STORAGE_KEY, raw);
    expect(() => journalService.getPendingOperations()).toThrow('RECOVERY_STORAGE_UNREADABLE');
    expect(() => journalService.savePendingOperation(operation())).toThrow('RECOVERY_STORAGE_UNREADABLE');
    expect(localStorage.getItem(JOURNAL_STORAGE_KEY)).toBe(raw);
  });

  it('does not use stale session data as the durable authority', () => {
    sessionStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify([operation()]));
    expect(journalService.getPendingOperations()).toEqual([]);
  });

  it('retains the returned hash in memory when durable persistence fails, and blocks another write', () => {
    journalService.savePendingOperation(operation());
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => journalService.updateHash('reserved', hash)).toThrow('STORAGE_PERSIST_FAILED');
    expect(journalService.getPendingOperations()[0].txHash).toBe(hash);
    setter.mockRestore();
    expect(() => journalService.savePendingOperation({ ...operation(), id: 'second' })).toThrow('CONCURRENT_WRITE_LOCKED');
    journalService.updateHash('reserved', hash);
    expect(new JournalService().getPendingOperations()[0].txHash).toBe(hash);
  });

  it('keeps the existing hash and lock if terminal cleanup cannot persist', () => {
    journalService.savePendingOperation(operation());
    journalService.updateHash('reserved', hash);
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(() => journalService.removeOperation('reserved')).toThrow('STORAGE_PERSIST_FAILED');
    expect(journalService.getPendingOperations()[0].txHash).toBe(hash);
    expect(() => journalService.acquireWriteLock('second')).toThrow('CONCURRENT_WRITE_LOCKED');
    setter.mockRestore();
    journalService.removeOperation('reserved');
    expect(journalService.getPendingOperations()).toEqual([]);
  });

  it('single-flights reconciliation and retains finalized success until readback agrees', async () => {
    journalService.savePendingOperation(operation());
    journalService.updateHash('reserved', hash);
    let finish!: (value: any) => void;
    const rpc = vi.spyOn(sharedRpc, 'getTransactionOutcome').mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const first = journalService.reconcilePendingOperations(undefined, async () => false);
    await expect(journalService.reconcilePendingOperations()).rejects.toThrow('RECONCILIATION_IN_PROGRESS');
    finish({ transaction: {}, status: 'FINALIZED', execution: 'FINISHED_WITH_RETURN' });
    expect((await first).stillPending).toEqual(['reserved']);
    expect(journalService.getPendingOperations()[0].txHash).toBe(hash);
    expect(rpc).toHaveBeenCalledOnce();
  });
});
