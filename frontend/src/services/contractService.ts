import { createClient } from 'genlayer-js';
import { CONTRACT_ADDRESS, STUDIONET_CONFIG } from '../config/chain.ts';
import { sharedRpc } from './rpcClient.ts';
import { walletService } from './walletService.ts';
import { journalService } from './journalService.ts';
import {
  CaseRecord,
  AssessmentRecord,
  IntegrationRecord,
  EventRecord,
  TxStep,
  PendingOperation,
} from '../types/domain.ts';

function formatSafeError(err: any): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (typeof err === 'bigint') return err.toString();
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
  } catch {
    return String(err);
  }
}

export class VerifiedTerminalFailure extends Error {}

function hasCaseIdentity(record: CaseRecord, id?: string): boolean {
  return Boolean(record && typeof record.case_id === 'string' && record.case_id.trim() &&
    (id === undefined || record.case_id === id) &&
    ['DRAFT', 'FROZEN', 'LOCKED', 'NOT_APPLICABLE', 'UNRESOLVED', 'SUPERSEDED_BY_SUCCESSOR'].includes(record.state));
}

function matchesCreation(record: CaseRecord, sender: string, params: Record<string, any>): boolean {
  return hasCaseIdentity(record) && record.owner?.toLowerCase() === sender.toLowerCase() &&
    record.client_nonce === params.clientNonce && record.part === params.part && record.section === params.section &&
    record.activity_date === params.activityDate && record.standard_designation_hint === params.designationHint.trim();
}

function matchesSuccessor(successor: CaseRecord, predecessor: CaseRecord, sender: string, params: Record<string, any>): boolean {
  return hasCaseIdentity(successor) && hasCaseIdentity(predecessor, params.oldCaseId) &&
    successor.case_id !== predecessor.case_id && successor.owner?.toLowerCase() === sender.toLowerCase() &&
    successor.client_nonce === params.clientNonce && successor.activity_date === params.newActivityDate &&
    successor.predecessor_case_id === predecessor.case_id && predecessor.successor_case_id === successor.case_id;
}

function matchesIntegration(record: IntegrationRecord, sender: string, namespace: string, caseId: string): boolean {
  return Boolean(record && record.case_id === caseId && record.caller?.toLowerCase() === sender.toLowerCase() &&
    record.namespace === namespace.trim() && record.state === 'ACTIVE');
}

function hasAssessment(record: CaseRecord, caseId: string): boolean {
  return hasCaseIdentity(record, caseId) && ['LOCKED', 'NOT_APPLICABLE', 'UNRESOLVED', 'SUPERSEDED_BY_SUCCESSOR'].includes(record.state) &&
    typeof record.current_assessment_id === 'string' && Boolean(record.current_assessment_id.trim());
}

export class ContractService {
  private static instance: ContractService;

  public static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  // --- READS ---

  public async getCase(caseId: string, skipCache = false): Promise<CaseRecord> {
    const raw = await sharedRpc.readContract('get_case', [caseId], 'case_detail', skipCache);
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  public async getCaseCount(skipCache = false): Promise<number> {
    const raw = await sharedRpc.readContract('get_case_count', [], 'public_lookup', skipCache);
    return Number(raw);
  }

  public async getCaseId(index: number, skipCache = false): Promise<string> {
    return await sharedRpc.readContract('get_case_id', [index], 'public_lookup', skipCache);
  }

  public async getCaseByFingerprint(
    part: string,
    section: string,
    activityDate: string,
    designation: string,
    skipCache = false
  ): Promise<CaseRecord> {
    const raw = await sharedRpc.readContract(
      'get_case_by_fingerprint',
      [part, section, activityDate, designation],
      'public_lookup',
      skipCache
    );
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  public async getCaseByNonce(sender: string, clientNonce: string, skipCache = false): Promise<CaseRecord> {
    const raw = await sharedRpc.readContract('get_case_by_nonce', [sender, clientNonce], 'public_lookup', skipCache);
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  public async getAssessment(assessmentId: string, skipCache = false): Promise<AssessmentRecord> {
    const raw = await sharedRpc.readContract('get_assessment', [assessmentId], 'assessment_view', skipCache);
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  public async getApplicableBaseline(caseId: string, skipCache = false): Promise<AssessmentRecord> {
    const raw = await sharedRpc.readContract('get_applicable_baseline', [caseId], 'baseline_view', skipCache);
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  public async getIntegration(caller: string, namespace: string, skipCache = false): Promise<IntegrationRecord> {
    const raw = await sharedRpc.readContract('get_integration', [caller, namespace], 'integration_view', skipCache);
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  public async getIntegrationCount(skipCache = false): Promise<number> {
    const raw = await sharedRpc.readContract('get_integration_count', [], 'integration_view', skipCache);
    return Number(raw);
  }

  public async getEvents(
    offset = 0,
    limit = 20,
    skipCache = false
  ): Promise<{ events: EventRecord[]; total: number; offset: number; limit: number }> {
    const raw = await sharedRpc.readContract('get_events', [offset, limit], 'auditor_view', skipCache);
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  public createWriteClient(params: {
    endpoint: string;
    account: `0x${string}`;
    provider: any;
  }) {
    return createClient(params);
  }

  public getConfiguredContractAddress(): string {
    return CONTRACT_ADDRESS;
  }

  public async getUpgrader(skipCache = false): Promise<string> {
    return await sharedRpc.readContract('get_upgrader', [], 'admin_view', skipCache);
  }

  public async verifyPendingOperation(op: PendingOperation): Promise<boolean> {
    if (!op.sender || op.chainId !== STUDIONET_CONFIG.chainId ||
      op.contractAddress?.toLowerCase() !== this.getConfiguredContractAddress().toLowerCase()) return false;
    try {
      switch (op.type) {
        case 'create_case':
          return matchesCreation(await this.getCaseByNonce(op.sender, String(op.params.clientNonce), true), op.sender, op.params);
        case 'freeze_case':
        case 'retry_unresolved': {
          const record = await this.getCase(String(op.params.caseId), true);
          return hasCaseIdentity(record, op.params.caseId) && record.state === 'FROZEN';
        }
        case 'assess_case': {
          const record = await this.getCase(String(op.params.caseId), true);
          return hasAssessment(record, op.params.caseId);
        }
        case 'create_successor': {
          const successor = await this.getCaseByNonce(op.sender, String(op.params.clientNonce), true);
          const predecessor = await this.getCase(String(op.params.oldCaseId), true);
          return matchesSuccessor(successor, predecessor, op.sender, op.params);
        }
        case 'activate_integration':
          return matchesIntegration(await this.getIntegration(op.sender, String(op.params.namespace).trim(), true), op.sender, op.params.namespace, op.params.caseId);
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  // --- WRITES & TRANSACTION PIPELINE ---

  public async createCase(
    clientNonce: string,
    part: string,
    section: string,
    activityDate: string,
    designationHint: string,
    onStepChange?: (step: TxStep, detail?: any) => void
  ): Promise<{ caseId: string; txHash: string }> {
    const { txHash, opId, sender } = await this.executeWrite(
      'create_case',
      [clientNonce, part, section, activityDate, designationHint],
      { clientNonce, part, section, activityDate, designationHint },
      onStepChange
    );

    try {
      // Authoritative readback before journal removal
      const caseRecord = await this.getCaseByNonce(sender, clientNonce, true);
      if (!matchesCreation(caseRecord, sender, { clientNonce, part, section, activityDate, designationHint })) {
        throw new Error('READBACK_MISMATCH: Created case identity does not match the submitted request');
      }
      sharedRpc.invalidateMethod('get_case_count');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { caseId: caseRecord.case_id, txHash });
      return { caseId: caseRecord.case_id, txHash };
    } catch (readErr: any) {
      this.reportReadbackFailure(opId, txHash, readErr, onStepChange);
      throw new Error(`AUTHORITATIVE_READBACK_FAILED: ${formatSafeError(readErr)}`);
    }
  }

  public async freezeCase(
    caseId: string,
    onStepChange?: (step: TxStep, detail?: any) => void
  ): Promise<{ txHash: string }> {
    const { txHash, opId } = await this.executeWrite('freeze_case', [caseId], { caseId }, onStepChange);

    try {
      // Authoritative readback before journal removal
      const updated = await this.getCase(caseId, true);
      if (!hasCaseIdentity(updated, caseId) || updated.state !== 'FROZEN') {
        throw new Error(`READBACK_MISMATCH: Expected FROZEN, got ${updated.state}`);
      }
      sharedRpc.invalidateMethod('get_case');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { caseId, txHash });
      return { txHash };
    } catch (readErr: any) {
      this.reportReadbackFailure(opId, txHash, readErr, onStepChange);
      throw new Error(`AUTHORITATIVE_READBACK_FAILED: ${formatSafeError(readErr)}`);
    }
  }

  public async assessCase(
    caseId: string,
    onStepChange?: (step: TxStep, detail?: any) => void
  ): Promise<{ assessmentId: string; txHash: string }> {
    const { txHash, opId } = await this.executeWrite('assess_case', [caseId], { caseId }, onStepChange);

    try {
      // Authoritative readback before journal removal
      const updated = await this.getCase(caseId, true);
      if (!hasAssessment(updated, caseId)) {
        throw new Error(`READBACK_MISMATCH: Case ${caseId} did not advance from ${updated.state}`);
      }
      sharedRpc.invalidateMethod('get_case');
      sharedRpc.invalidateMethod('get_assessment');
      sharedRpc.invalidateMethod('get_applicable_baseline');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { assessmentId: updated.current_assessment_id, txHash });
      return { assessmentId: updated.current_assessment_id, txHash };
    } catch (readErr: any) {
      this.reportReadbackFailure(opId, txHash, readErr, onStepChange);
      throw new Error(`AUTHORITATIVE_READBACK_FAILED: ${formatSafeError(readErr)}`);
    }
  }

  public async retryUnresolved(
    caseId: string,
    onStepChange?: (step: TxStep, detail?: any) => void
  ): Promise<{ txHash: string }> {
    const { txHash, opId } = await this.executeWrite('retry_unresolved', [caseId], { caseId }, onStepChange);

    try {
      // Authoritative readback before journal removal
      const updated = await this.getCase(caseId, true);
      if (!hasCaseIdentity(updated, caseId) || updated.state !== 'FROZEN') {
        throw new Error(`READBACK_MISMATCH: Expected FROZEN after retry reservation, got ${updated.state}`);
      }
      sharedRpc.invalidateMethod('get_case');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { caseId, txHash });
      return { txHash };
    } catch (readErr: any) {
      this.reportReadbackFailure(opId, txHash, readErr, onStepChange);
      throw new Error(`AUTHORITATIVE_READBACK_FAILED: ${formatSafeError(readErr)}`);
    }
  }

  public async createSuccessor(
    oldCaseId: string,
    clientNonce: string,
    newActivityDate: string,
    onStepChange?: (step: TxStep, detail?: any) => void
  ): Promise<{ newCaseId: string; txHash: string }> {
    const { txHash, opId, sender } = await this.executeWrite(
      'create_successor',
      [oldCaseId, clientNonce, newActivityDate],
      { oldCaseId, clientNonce, newActivityDate },
      onStepChange
    );

    try {
      // Authoritative readback before journal removal
      const newCase = await this.getCaseByNonce(sender, clientNonce, true);
      const oldCase = await this.getCase(oldCaseId, true);

      if (!matchesSuccessor(newCase, oldCase, sender, { oldCaseId, clientNonce, newActivityDate })) {
        throw new Error('READBACK_MISMATCH: Old case successor link missing');
      }
      sharedRpc.invalidateMethod('get_case_count');
      sharedRpc.invalidateMethod('get_case');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { newCaseId: newCase.case_id, txHash });
      return { newCaseId: newCase.case_id, txHash };
    } catch (readErr: any) {
      this.reportReadbackFailure(opId, txHash, readErr, onStepChange);
      throw new Error(`AUTHORITATIVE_READBACK_FAILED: ${formatSafeError(readErr)}`);
    }
  }

  public async activateIntegration(
    namespace: string,
    caseId: string,
    onStepChange?: (step: TxStep, detail?: any) => void
  ): Promise<{ txHash: string }> {
    const { txHash, opId, sender } = await this.executeWrite(
      'activate_integration',
      [namespace, caseId],
      { namespace, caseId },
      onStepChange
    );

    try {
      // Authoritative readback before journal removal
      const integ = await this.getIntegration(sender, namespace.trim(), true);
      if (!matchesIntegration(integ, sender, namespace, caseId)) {
        throw new Error('READBACK_MISMATCH: Integration case_id did not match');
      }
      sharedRpc.invalidateMethod('get_integration');
      sharedRpc.invalidateMethod('get_integration_count');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { namespace, caseId, txHash });
      return { txHash };
    } catch (readErr: any) {
      this.reportReadbackFailure(opId, txHash, readErr, onStepChange);
      throw new Error(`AUTHORITATIVE_READBACK_FAILED: ${formatSafeError(readErr)}`);
    }
  }

  private reportReadbackFailure(opId: string, txHash: string, error: unknown, onStepChange?: (step: TxStep, detail?: any) => void): void {
    let persistenceDegraded = false;
    try { journalService.updateStatus(opId, 'SUBMITTED', formatSafeError(error)); }
    catch { persistenceDegraded = true; }
    onStepChange?.('RECONCILIATION_REQUIRED', { txHash, persistenceDegraded,
      message: 'The transaction result could not be verified. Keep its hash and continue verification; do not submit again.' });
  }

  private async executeWrite(
    method: string,
    args: any[],
    params: Record<string, any>,
    onStepChange?: (step: TxStep, detail?: any) => void
  ): Promise<{ txHash: string; opId: string; sender: string }> {
    const configuredAddress = this.getConfiguredContractAddress();
    if (!configuredAddress) {
      throw new Error('CONTRACT_NOT_CONFIGURED');
    }
    const targetAddress = configuredAddress as `0x${string}`;

    const walletState = walletService.getState();
    if (!walletState.connected || !walletState.provider || !walletState.address) {
      throw new Error('WALLET_NOT_CONNECTED');
    }

    if (!walletState.isCorrectChain) {
      await walletService.switchChain();
    }

    const opId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pendingOp: PendingOperation = {
      id: opId,
      type: method,
      timestamp: Date.now(),
      params,
      status: 'PRE_SIGN',
      sender: walletState.address,
      chainId: STUDIONET_CONFIG.chainId,
      contractAddress: targetAddress,
    };

    journalService.savePendingOperation(pendingOp);
    onStepChange?.('WAITING_FOR_WALLET', { method, params });

    let txHash: string;
    try {
      // Blocker 1: Must pass selected EIP-1193 provider directly
      const client = this.createWriteClient({
        endpoint: STUDIONET_CONFIG.rpcUrl,
        account: walletState.address as `0x${string}`,
        provider: walletState.provider,
      });

      txHash = await client.writeContract({
        address: targetAddress,
        functionName: method,
        args,
        value: 0n,
      });
    } catch (err: any) {
      const rejected = err?.code === 4001 || err?.cause?.code === 4001;
      let cleaned = false;
      if (rejected) {
        try { journalService.removeOperation(opId); cleaned = true; } catch { /* retain reservation */ }
      }
      onStepChange?.(rejected && cleaned ? 'REJECTED' : 'RECONCILIATION_REQUIRED', {
        message: rejected && cleaned ? 'You declined the wallet request.' : 'The wallet result is uncertain. Check wallet activity before another write. Do not resubmit.',
      });
      throw err;
    }

    // Hash obtained: update journal to SUBMITTED
    let persistenceDegraded = false;
    try { journalService.updateHash(opId, txHash); }
    catch (error) {
      if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
        onStepChange?.('RECONCILIATION_REQUIRED', { message: 'The wallet returned no valid transaction hash. Check wallet activity; do not resubmit.' });
        throw error;
      }
      persistenceDegraded = true;
    }
    onStepChange?.('SUBMITTED', { txHash, persistenceDegraded });

    // Poll for finality and execution result
    onStepChange?.('WAITING_FOR_FINALITY', { txHash, persistenceDegraded });
    try {
      await this.waitForFinalizedTransaction(txHash, 300_000, () => onStepChange?.('VERIFYING_EXECUTION', { txHash, persistenceDegraded }));
    } catch (finErr: any) {
      const message = formatSafeError(finErr);
      let terminal = finErr instanceof VerifiedTerminalFailure;
      try {
        if (terminal) journalService.removeOperation(opId);
        else journalService.updateStatus(opId, 'SUBMITTED', message);
      } catch { persistenceDegraded = true; terminal = false; }
      onStepChange?.(terminal ? 'FAILED' : 'RECONCILIATION_REQUIRED', { txHash, persistenceDegraded,
        message: terminal ? 'The finalized transaction did not execute successfully.' : 'Verification stopped. Keep this transaction hash and check its status; do not resubmit.' });
      throw finErr;
    }

    onStepChange?.('VERIFYING_READBACK', { txHash, persistenceDegraded });
    return { txHash, opId, sender: walletState.address };
  }

  public async waitForFinalizedTransaction(
    txHash: string, deadlineMs = 300_000, onFinalized?: () => void
  ): Promise<any> {
    const deadline = Date.now() + Math.min(deadlineMs, 300_000);
    let interval = 2500;
    for (let polls = 0; polls < 24 && Date.now() < deadline; polls++) {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        await new Promise<void>((resolve) => {
          const cleanup = () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisible);
            resolve();
          };
          const onVisible = () => { if (document.visibilityState === 'visible') cleanup(); };
          const timer = setTimeout(cleanup, Math.max(0, deadline - Date.now()));
          document.addEventListener('visibilitychange', onVisible);
        });
      }
      if (Date.now() >= deadline) break;
      sharedRpc.trackJourneyCall('tx_poll');
      let timer: ReturnType<typeof setTimeout> | undefined;
      let outcome: Awaited<ReturnType<typeof sharedRpc.getTransactionOutcome>>;
      try {
        outcome = await Promise.race([
          sharedRpc.getTransactionOutcome(txHash),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('TRANSACTION_READ_TIMEOUT')),
              Math.min(15_000, deadline - Date.now()));
          }),
        ]);
      } finally { clearTimeout(timer); }
      const { transaction: receipt, status, execution } = outcome;
      if (receipt && status === 'FINALIZED') {
        onFinalized?.();
        if (execution === 'FINISHED_WITH_RETURN') return receipt;
        if (execution === 'FINISHED_WITH_ERROR') {
          throw new VerifiedTerminalFailure(`TRANSACTION_EXECUTION_FAILED: ${formatSafeError(receipt.error || receipt.data || receipt.result_data)}`);
        }
        throw new Error(`TRANSACTION_UNKNOWN_EXECUTION_RESULT: Execution result was '${execution || 'MISSING'}'`);
      }
      // Unknown/nonfinal status cannot unlock the original operation.
      if (polls === 23) break;
      await new Promise((resolve) => setTimeout(resolve, Math.min(interval, Math.max(0, deadline - Date.now()))));
      interval = Math.min(interval * 1.25, 10_000);
    }
    throw new Error('TRANSACTION_TIMEOUT_DEADLINE_EXCEEDED');
  }
}

export const contractService = ContractService.getInstance();
