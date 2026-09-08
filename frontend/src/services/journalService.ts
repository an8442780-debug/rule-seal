import { PendingOperation } from '../types/domain.ts';
import { sharedRpc } from './rpcClient.ts';
import { CONTRACT_ADDRESS, STUDIONET_CONFIG } from '../config/chain.ts';

export const JOURNAL_STORAGE_KEY = `rule-seal.pending.v1:${STUDIONET_CONFIG.chainId}:${CONTRACT_ADDRESS.toLowerCase() || 'unconfigured'}`;

export class JournalService {
  private static instance: JournalService;
  private activeWriteLock: string | null = null;
  private volatilePending: PendingOperation[] | null = null;
  private reconciling = false;

  public static getInstance(): JournalService {
    if (!JournalService.instance) {
      JournalService.instance = new JournalService();
    }
    return JournalService.instance;
  }

  // Pre-write capability probe (set/get/remove)
  public probeStorage(): boolean {
    const probeKey = `${JOURNAL_STORAGE_KEY}.probe`;
    try {
      if (typeof window === 'undefined') return false;
      sessionStorage.setItem(probeKey, 'ok');
      const sVal = sessionStorage.getItem(probeKey);
      sessionStorage.removeItem(probeKey);
      if (sVal !== 'ok') return false;

      localStorage.setItem(probeKey, 'ok');
      const lVal = localStorage.getItem(probeKey);
      localStorage.removeItem(probeKey);
      if (lVal !== 'ok') return false;

      return true;
    } catch {
      return false;
    }
  }

  public acquireWriteLock(opId: string): void {
    if (this.activeWriteLock && this.activeWriteLock !== opId) {
      throw new Error(`CONCURRENT_WRITE_LOCKED: Operation ${this.activeWriteLock} is currently in-flight.`);
    }
    this.activeWriteLock = opId;
  }

  public releaseWriteLock(opId: string): void {
    if (this.activeWriteLock === opId) {
      this.activeWriteLock = null;
    }
  }

  public getPendingOperations(): PendingOperation[] {
    if (this.volatilePending) return structuredClone(this.volatilePending);
    try {
      // One durable authority; a copied tab's sessionStorage must not resurrect stale data.
      const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (raw === null) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.some((item) => !item ||
        typeof item.id !== 'string' || !item.id || typeof item.type !== 'string' || !item.type ||
        !Number.isFinite(item.timestamp) || !item.params || typeof item.params !== 'object' ||
        Array.isArray(item.params) || !['PRE_SIGN', 'SUBMITTED', 'FINALIZED', 'FAILED'].includes(item.status) ||
        (item.txHash !== undefined && !/^0x[0-9a-fA-F]{64}$/.test(item.txHash)))) {
        throw new Error('Malformed recovery record');
      }
      if (new Set(parsed.map((item) => item.id)).size !== parsed.length) throw new Error('Duplicate recovery identity');
      return parsed;
    } catch {
      throw new Error('RECOVERY_STORAGE_UNREADABLE: Restore storage access before another write. Existing recovery data has not been deleted.');
    }
  }

  public savePendingOperation(op: PendingOperation): void {
    if (!this.probeStorage()) {
      throw new Error('STORAGE_CAPABILITY_PROBE_FAILED: Local/Session storage is disabled or quota exceeded.');
    }
    const list = this.getPendingOperations();
    if (list.length > 0) throw new Error('CONCURRENT_WRITE_LOCKED: Reconcile the existing operation before another write.');
    this.acquireWriteLock(op.id);
    list.push(op);
    this.persist(list);
  }

  public updateHash(id: string, txHash: string): void {
    if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw new Error('INVALID_TRANSACTION_HASH: Reconciliation is required.');
    const list = this.getPendingOperations();
    const target = list.find((item) => item.id === id);
    if (!target) throw new Error('RECOVERY_OPERATION_MISSING: Do not resubmit.');
    if (target) {
      target.txHash = txHash;
      target.status = 'SUBMITTED';
      this.persist(list);
    }
  }

  public updateStatus(id: string, status: PendingOperation['status'], error?: string): void {
    const list = this.getPendingOperations();
    const target = list.find((item) => item.id === id);
    if (target) {
      target.status = status;
      if (error) (target as any).error = error;
      this.persist(list);
    }
  }

  public removeOperation(id: string): void {
    const list = this.getPendingOperations().filter((item) => item.id !== id);
    // A failed cleanup must not erase the volatile hash or release the write lock.
    this.persist(list, false);
    this.releaseWriteLock(id);
  }

  private persist(list: PendingOperation[], retainOnFailure = true): void {
    try {
      const serialized = JSON.stringify(list, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
      localStorage.setItem(JOURNAL_STORAGE_KEY, serialized);
      if (localStorage.getItem(JOURNAL_STORAGE_KEY) !== serialized) throw new Error('Storage readback mismatch');
      this.volatilePending = null;
    } catch (e) {
      if (retainOnFailure) this.volatilePending = structuredClone(list);
      throw new Error(`STORAGE_PERSIST_FAILED: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Bounded reload reconciliation against RPC receipts
  public async reconcilePendingOperations(
    onProgress?: (reconciled: number, total: number) => void,
    verifyEffect?: (operation: PendingOperation) => Promise<boolean>
  ): Promise<{ reconciled: PendingOperation[]; finalized: string[]; failed: string[]; stillPending: string[] }> {
    if (this.reconciling) throw new Error('RECONCILIATION_IN_PROGRESS');
    this.reconciling = true;
    try {
    const pending = this.getPendingOperations();
    const finalized: string[] = [];
    const failed: string[] = [];
    const stillPending: string[] = [];
    let count = 0;
    for (const op of pending) {
      count++;
      onProgress?.(count, pending.length);

      if (!op.txHash) {
        // No hash is not proof of no submission. Preserve the pre-sign reservation.
        stillPending.push(op.id);
        continue;
      }

      try {
        const { transaction: receipt, status, execution: execRes } = await sharedRpc.getTransactionOutcome(op.txHash);
        if (receipt) {
          if (status === 'FINALIZED') {
            if (execRes === 'FINISHED_WITH_RETURN') {
              if (verifyEffect && await verifyEffect(op)) {
                this.removeOperation(op.id);
                finalized.push(op.id);
              } else {
                stillPending.push(op.id);
              }
            } else if (execRes === 'FINISHED_WITH_ERROR') {
              this.removeOperation(op.id);
              failed.push(op.id);
            } else {
              stillPending.push(op.id);
            }
          } else if (status === 'CANCELED' || status === 'ERROR' || status === 'REVERTED') {
            this.updateStatus(op.id, 'FAILED' as any, receipt.error || 'Transaction cancelled or failed');
            failed.push(op.id);
          } else {
            stillPending.push(op.id);
          }
        } else {
          stillPending.push(op.id);
        }
      } catch {
        stillPending.push(op.id);
      }
    }

    return {
      reconciled: this.getPendingOperations(),
      finalized,
      failed,
      stillPending,
    };
    } finally {
      this.reconciling = false;
    }
  }
}

export const journalService = JournalService.getInstance();
