import { createClient } from 'genlayer-js';
import { STUDIONET_CONFIG, CONTRACT_ADDRESS } from '../config/chain.ts';

interface CacheEntry {
  data: any;
  expiresAt: number;
}

export class RpcClient {
  private static instance: RpcClient;
  private client: any;
  private cache: Map<string, CacheEntry> = new Map();
  private inFlight: Map<string, Promise<any>> = new Map();
  private callCountsByJourney: Map<string, number> = new Map();
  private totalCalls = 0;

  private constructor() {
    this.client = createClient({
      endpoint: STUDIONET_CONFIG.rpcUrl,
    });
  }

  public static getInstance(): RpcClient {
    if (!RpcClient.instance) {
      RpcClient.instance = new RpcClient();
    }
    return RpcClient.instance;
  }

  public trackJourneyCall(journey: string): void {
    const current = this.callCountsByJourney.get(journey) || 0;
    this.callCountsByJourney.set(journey, current + 1);
    this.totalCalls++;
  }

  public getJourneyMetrics(): { total: number; journeys: Record<string, number> } {
    const journeys: Record<string, number> = {};
    this.callCountsByJourney.forEach((count, key) => {
      journeys[key] = count;
    });
    return { total: this.totalCalls, journeys };
  }

  public resetJourneyMetrics(): void {
    this.callCountsByJourney.clear();
    this.totalCalls = 0;
  }

  public clearCache(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  public invalidateMethod(method: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(`:${method}:`)) {
        this.cache.delete(key);
      }
    }
    for (const key of this.inFlight.keys()) {
      if (key.includes(`:${method}:`)) this.inFlight.delete(key);
    }
  }

  private generateCacheKey(method: string, args: any[], address = CONTRACT_ADDRESS): string {
    const normArgs = JSON.stringify(args || []);
    return `${STUDIONET_CONFIG.chainId}:${address}:${method}:${normArgs}`;
  }

  public async readContract(
    method: string,
    args: any[] = [],
    journey = 'public_read',
    skipCache = false,
    address = CONTRACT_ADDRESS
  ): Promise<any> {
    const targetAddress = address || CONTRACT_ADDRESS;
    if (!targetAddress) {
      throw new Error('CONTRACT_NOT_CONFIGURED');
    }

    const key = this.generateCacheKey(method, args, targetAddress);
    const now = Date.now();

    if (!skipCache) {
      const cached = this.cache.get(key);
      if (cached && cached.expiresAt > now) {
        return cached.data;
      }
    }

    // In-flight deduplication
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const fetchPromise: Promise<any> = this.executeWithRetry(async () => {
      this.trackJourneyCall(journey);
      const res = await this.client.readContract({
        address: targetAddress,
        functionName: method,
        args,
      });
      return res;
    }, (): boolean => this.inFlight.get(key) === fetchPromise)
      .then((data) => {
        if (this.inFlight.get(key) !== fetchPromise) {
          throw new Error('RPC_READ_INVALIDATED: Request a fresh read.');
        }
        this.cache.set(key, { data, expiresAt: Date.now() + 10_000 });
        this.inFlight.delete(key);
        return data;
      })
      .catch((err) => {
        if (this.inFlight.get(key) === fetchPromise) this.inFlight.delete(key);
        throw err;
      });

    this.inFlight.set(key, fetchPromise);
    return fetchPromise;
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, isCurrent: () => boolean): Promise<T> {
    let attempt = 0;
    while (attempt < 3) {
      if (attempt > 0 && !isCurrent()) throw new Error('RPC_READ_INVALIDATED: Request a fresh read.');
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        const msg = String(err?.message || err);
        const status = Number(err?.status ?? err?.statusCode ?? err?.response?.status ?? msg.match(/\bHTTP\s+(\d{3})\b/i)?.[1]);
        const retryable = status === 429 || (status >= 500 && status <= 599);

        if (retryable && attempt < 3) {
          const delay = (attempt === 1 ? 1000 : 3000) + Math.random() * 200;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw new Error('RPC_MAX_RETRIES_EXCEEDED');
  }

  public getRawClient(): any {
    return this.client;
  }

  public async getTransactionOutcome(hash: string): Promise<{ transaction: any; status: string; execution: string }> {
    const transaction = await this.client.getTransaction({ hash });
    const status = (transaction?.statusName || transaction?.status_name || transaction?.status || '').toString().toUpperCase();
    let execution = (
      transaction?.txExecutionResultName ||
      transaction?.tx_execution_result_name ||
      transaction?.execution_result ||
      ''
    ).toString().toUpperCase();

    if (!execution && status === 'FINALIZED') {
      const leader = transaction?.consensus_data?.leader_receipt?.find?.((receipt: any) => receipt?.mode === 'leader');
      const leaderExecution = (leader?.execution_result || '').toString().toUpperCase();
      const resultStatus = (leader?.result?.status || '').toString().toUpperCase();
      if (leaderExecution === 'SUCCESS' && resultStatus === 'RETURN') execution = 'FINISHED_WITH_RETURN';
      if (leaderExecution === 'ERROR' || resultStatus === 'ERROR') execution = 'FINISHED_WITH_ERROR';
    }

    return { transaction, status, execution };
  }
}

export const sharedRpc = RpcClient.getInstance();
