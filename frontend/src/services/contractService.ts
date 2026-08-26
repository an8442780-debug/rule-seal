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
    const wallet = walletService.getState();
    try {
      switch (op.type) {
        case 'create_case':
          return (await this.getCaseByNonce(wallet.address || '', String(op.params.clientNonce), true)).case_id !== '';
        case 'freeze_case':
          return (await this.getCase(String(op.params.caseId), true)).state === 'FROZEN';
        case 'assess_case': {
          const record = await this.getCase(String(op.params.caseId), true);
          return !['DRAFT', 'FROZEN'].includes(record.state) && Boolean(record.current_assessment_id);
        }
        case 'retry_unresolved':
          return (await this.getCase(String(op.params.caseId), true)).state === 'FROZEN';
        case 'create_successor': {
          const successor = await this.getCaseByNonce(wallet.address || '', String(op.params.clientNonce), true);
          const predecessor = await this.getCase(String(op.params.oldCaseId), true);
          return predecessor.successor_case_id === successor.case_id;
        }
        case 'activate_integration':
          return (await this.getIntegration(wallet.address || '', String(op.params.namespace), true)).case_id === op.params.caseId;
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
    const { txHash, opId } = await this.executeWrite(
      'create_case',
      [clientNonce, part, section, activityDate, designationHint],
      { clientNonce, part, section, activityDate, designationHint },
      onStepChange
    );

    try {
      // Authoritative readback before journal removal
      const walletState = walletService.getState();
      const caseRecord = await this.getCaseByNonce(walletState.address || '', clientNonce, true);
      sharedRpc.invalidateMethod('get_case_count');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { caseId: caseRecord.case_id, txHash });
      return { caseId: caseRecord.case_id, txHash };
    } catch (readErr: any) {
      journalService.updateStatus(opId, 'SUBMITTED', formatSafeError(readErr));
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
      if (updated.state !== 'FROZEN') {
        throw new Error(`READBACK_MISMATCH: Expected FROZEN, got ${updated.state}`);
      }
      sharedRpc.invalidateMethod('get_case');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { caseId, txHash });
      return { txHash };
    } catch (readErr: any) {
      journalService.updateStatus(opId, 'SUBMITTED', formatSafeError(readErr));
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
      if (updated.state === 'DRAFT' || updated.state === 'FROZEN') {
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
      journalService.updateStatus(opId, 'SUBMITTED', formatSafeError(readErr));
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
      if (updated.state !== 'FROZEN') {
        throw new Error(`READBACK_MISMATCH: Expected FROZEN after retry reservation, got ${updated.state}`);
      }
      sharedRpc.invalidateMethod('get_case');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { caseId, txHash });
      return { txHash };
    } catch (readErr: any) {
      journalService.updateStatus(opId, 'SUBMITTED', formatSafeError(readErr));
      throw new Error(`AUTHORITATIVE_READBACK_FAILED: ${formatSafeError(readErr)}`);
    }
  }

  public async createSuccessor(
    oldCaseId: string,
    clientNonce: string,
    newActivityDate: string,
    onStepChange?: (step: TxStep, detail?: any) => void
  ): Promise<{ newCaseId: string; txHash: string }> {
    const { txHash, opId } = await this.executeWrite(
      'create_successor',
      [oldCaseId, clientNonce, newActivityDate],
      { oldCaseId, clientNonce, newActivityDate },
      onStepChange
    );

    try {
      // Authoritative readback before journal removal
      const walletState = walletService.getState();
      const newCase = await this.getCaseByNonce(walletState.address || '', clientNonce, true);
      const oldCase = await this.getCase(oldCaseId, true);

      if (oldCase.successor_case_id !== newCase.case_id) {
        throw new Error('READBACK_MISMATCH: Old case successor link missing');
      }
      sharedRpc.invalidateMethod('get_case_count');
      sharedRpc.invalidateMethod('get_case');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { newCaseId: newCase.case_id, txHash });
      return { newCaseId: newCase.case_id, txHash };
    } catch (readErr: any) {
      journalService.updateStatus(opId, 'SUBMITTED', formatSafeError(readErr));
      throw new Error(`AUTHORITATIVE_READBACK_FAILED: ${formatSafeError(readErr)}`);
    }
  }

  public async activateIntegration(
    namespace: string,
    caseId: string,
    onStepChange?: (step: TxStep, detail?: any) => void
  ): Promise<{ txHash: string }> {
    const { txHash, opId } = await this.executeWrite(
      'activate_integration',
      [namespace, caseId],
      { namespace, caseId },
      onStepChange
    );

    try {
      // Authoritative readback before journal removal
      const walletState = walletService.getState();
      const integ = await this.getIntegration(walletState.address || '', namespace, true);
      if (integ.case_id !== caseId) {
        throw new Error('READBACK_MISMATCH: Integration case_id did not match');
      }
      sharedRpc.invalidateMethod('get_integration');
      sharedRpc.invalidateMethod('get_integration_count');
      sharedRpc.invalidateMethod('get_events');

      journalService.removeOperation(opId);
      onStepChange?.('SUCCESS', { namespace, caseId, txHash });
      return { txHash };
    } catch (readErr: any) {
      journalService.updateStatus(opId, 'SUBMITTED', formatSafeError(readErr));
      throw new Error(`AUTHORITATIVE_READBACK_FAILED: ${formatSafeError(readErr)}`);
    }
  }

  private async executeWrite(
    method: string,
    args: any[],
    params: Record<string, any>,
    onStepChange?: (step: TxStep, detail?: any) => void
  ): Promise<{ txHash: string; opId: string }> {
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
    };

    journalService.savePendingOperation(pendingOp);
    onStepChange?.('SIGNING', { method, params });

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
      journalService.removeOperation(opId);
      onStepChange?.('ERROR', { error: formatSafeError(err) });
      throw err;
    }

    // Hash obtained: update journal to SUBMITTED
    journalService.updateHash(opId, txHash);
    onStepChange?.('SUBMITTED', { txHash });

    // Poll for finality and execution result
    onStepChange?.('FINALIZING', { txHash });
    try {
      await this.waitForFinalizedTransaction(txHash);
    } catch (finErr: any) {
      const message = formatSafeError(finErr);
      if (message.includes('TRANSACTION_EXECUTION_FAILED')) {
        journalService.removeOperation(opId);
      } else {
        journalService.updateStatus(opId, 'SUBMITTED', message);
      }
      onStepChange?.('ERROR', { error: formatSafeError(finErr) });
      throw finErr;
    }

    return { txHash, opId };
  }

  public async waitForFinalizedTransaction(txHash: string, deadlineMs = 600_000): Promise<any> {
    const startTime = Date.now();
    let pollInterval = 2500;
    while (Date.now() - startTime < deadlineMs) {
      // Pause if tab is hidden
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        await new Promise((r) => {
          const onVisible = () => {
            if (document.visibilityState === 'visible') {
              document.removeEventListener('visibilitychange', onVisible);
              r(null);
            }
          };
          document.addEventListener('visibilitychange', onVisible);
        });
      }

      try {
        sharedRpc.trackJourneyCall('tx_poll');
        const { transaction: receipt, status, execution: execRes } = await sharedRpc.getTransactionOutcome(txHash);
        if (receipt) {

          // Blocker 2: ACCEPTED must NOT be treated as finalized. Finality requires status === FINALIZED
          if (status === 'FINALIZED') {
            if (execRes === 'FINISHED_WITH_RETURN') {
              return receipt;
            }

            if (execRes === 'FINISHED_WITH_ERROR') {
              const errMsg = formatSafeError(
                receipt.error || receipt.data || receipt.result_data || 'Contract execution reverted on-chain'
              );
              throw new Error(`TRANSACTION_EXECUTION_FAILED: ${errMsg}`);
            }

            // Unknown execution result
            throw new Error(`TRANSACTION_UNKNOWN_EXECUTION_RESULT: Execution result was '${execRes || 'MISSING'}'`);
          }

          if (status === 'CANCELED' || status === 'ERROR' || status === 'REVERTED') {
            throw new Error(`TRANSACTION_EXECUTION_FAILED: Transaction status was ${status}`);
          }
          // If status is ACCEPTED, PENDING, PROPOSING, etc., continue polling!
        }
      } catch (err: any) {
        if (
          err.message &&
          (err.message.includes('TRANSACTION_EXECUTION_FAILED') ||
            err.message.includes('TRANSACTION_UNKNOWN_EXECUTION_RESULT'))
        ) {
          throw err;
        }
        // Transient network error while polling: continue backoff
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      // Bounded backoff up to 10 seconds
      pollInterval = Math.min(pollInterval * 1.25, 10_000);
    }

    throw new Error('TRANSACTION_TIMEOUT_DEADLINE_EXCEEDED');
  }
}

export const contractService = ContractService.getInstance();
