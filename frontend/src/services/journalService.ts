import { PendingOperation } from '../types/domain.ts';
import { sharedRpc } from './rpcClient.ts';

const STORAGE_KEY = 'real_pending_ops_v1';

export class JournalService {
  private static instance: JournalService;
  private activeWriteLock: string | null = null;

  public static getInstance(): JournalService {
    if (!JournalService.instance) {
      JournalService.instance = new JournalService();
    }
    return JournalService.instance;
  }

  // Pre-write capability probe (set/get/remove)
  public probeStorage(): boolean {
    const probeKey = '__storage_capability_probe__';
    try {
      if (typeof window === 'undefined') return true;
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
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public savePendingOperation(op: PendingOperation): void {
    if (!this.probeStorage()) {
      throw new Error('STORAGE_CAPABILITY_PROBE_FAILED: Local/Session storage is disabled or quota exceeded.');
    }
    this.acquireWriteLock(op.id);
    const list = this.getPendingOperations().filter((item) => item.id !== op.id);
    list.push(op);
    this.persist(list);
  }

  public updateHash(id: string, txHash: string): void {
    const list = this.getPendingOperations();
    const target = list.find((item) => item.id === id);
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
    this.releaseWriteLock(id);
    const list = this.getPendingOperations().filter((item) => item.id !== id);
    this.persist(list);
  }

  private persist(list: PendingOperation[]): void {
    try {
      const serialized = JSON.stringify(list, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
      sessionStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      throw new Error(`STORAGE_PERSIST_FAILED: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Bounded reload reconciliation against RPC receipts
  public async reconcilePendingOperations(
    onProgress?: (reconciled: number, total: number) => void,
    verifyEffect?: (operation: PendingOperation) => Promise<boolean>
  ): Promise<{ reconciled: PendingOperation[]; finalized: string[]; failed: string[]; stillPending: string[] }> {
    const pending = this.getPendingOperations();
    const finalized: string[] = [];
    const failed: string[] = [];
    const stillPending: string[] = [];
    let count = 0;
    for (const op of pending) {
      count++;
      onProgress?.(count, pending.length);

      if (!op.txHash) {
        // Abandoned before submission
        this.removeOperation(op.id);
        failed.push(op.id);
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
  }
}

export const journalService = JournalService.getInstance();
