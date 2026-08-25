import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { sharedRpc } from '../services/rpcClient.ts';

const MOCK_ADDR = '0x1111111111111111111111111111111111111111';

describe('RpcClient', () => {
  beforeEach(() => {
    sharedRpc.clearCache();
    sharedRpc.resetJourneyMetrics();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks journey metrics when readContract is executed', async () => {
    const rawClient = sharedRpc.getRawClient();
    vi.spyOn(rawClient, 'readContract').mockResolvedValue('REAL-000001');

    await sharedRpc.readContract('get_case_id', [0], 'public_lookup', true, MOCK_ADDR);
    await sharedRpc.readContract('get_case_id', [1], 'public_lookup', true, MOCK_ADDR);

    const metrics = sharedRpc.getJourneyMetrics();
    expect(metrics.total).toBe(2);
    expect(metrics.journeys['public_lookup']).toBe(2);
  });

  it('deduplicates concurrent in-flight readContract calls', async () => {
    const rawClient = sharedRpc.getRawClient();
    let callCount = 0;
    vi.spyOn(rawClient, 'readContract').mockImplementation(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 20));
      return JSON.stringify({ case_id: 'REAL-000001', state: 'LOCKED' });
    });

    const [res1, res2] = await Promise.all([
      sharedRpc.readContract('get_case', ['REAL-000001'], 'case_detail', false, MOCK_ADDR),
      sharedRpc.readContract('get_case', ['REAL-000001'], 'case_detail', false, MOCK_ADDR),
    ]);

    expect(res1).toBe(res2);
    expect(callCount).toBe(1);
  });

  it('serves cached data on subsequent calls within TTL', async () => {
    const rawClient = sharedRpc.getRawClient();
    let callCount = 0;
    vi.spyOn(rawClient, 'readContract').mockImplementation(async () => {
      callCount++;
      return JSON.stringify({ case_id: 'REAL-000001' });
    });

    await sharedRpc.readContract('get_case', ['REAL-000001'], 'case_detail', false, MOCK_ADDR);
    await sharedRpc.readContract('get_case', ['REAL-000001'], 'case_detail', false, MOCK_ADDR);

    expect(callCount).toBe(1);
  });

  it('invalidates cached method entries when invalidateMethod is called', async () => {
    const rawClient = sharedRpc.getRawClient();
    let callCount = 0;
    vi.spyOn(rawClient, 'readContract').mockImplementation(async () => {
      callCount++;
      return '5';
    });

    await sharedRpc.readContract('get_case_count', [], 'public_lookup', false, MOCK_ADDR);
    expect(callCount).toBe(1);

    sharedRpc.invalidateMethod('get_case_count');

    await sharedRpc.readContract('get_case_count', [], 'public_lookup', false, MOCK_ADDR);
    expect(callCount).toBe(2);
  });

  it('retries on 429 rate limits and 5xx server errors before succeeding', async () => {
    vi.useFakeTimers();
    const rawClient = sharedRpc.getRawClient();
    let attempts = 0;
    vi.spyOn(rawClient, 'readContract').mockImplementation(async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error('HTTP 429 Too Many Requests');
      }
      if (attempts === 2) {
        throw new Error('HTTP 503 Service Unavailable');
      }
      return 'REAL-000001';
    });

    const promise = sharedRpc.readContract('get_case_id', [0], 'public_lookup', true, MOCK_ADDR);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('REAL-000001');
    expect(attempts).toBe(3);
    vi.useRealTimers();
  });

  it('fails after exceeding maximum retry attempts on persistent 5xx error', async () => {
    vi.useFakeTimers();
    const rawClient = sharedRpc.getRawClient();
    vi.spyOn(rawClient, 'readContract').mockRejectedValue(new Error('HTTP 500 Internal Server Error'));

    const promise = sharedRpc.readContract('get_case_id', [0], 'public_lookup', true, MOCK_ADDR);
    const rejectionPromise = expect(promise).rejects.toThrow('HTTP 500');
    await vi.runAllTimersAsync();
    await rejectionPromise;
    vi.useRealTimers();
  });
});
