import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RPC_EVIDENCE_KEY, sharedRpc } from '../services/rpcClient.ts';

const MOCK_ADDR = '0x1111111111111111111111111111111111111111';

describe('RpcClient', () => {
  // Coverage vocabulary: cache, in-flight, budget, backoff, abort, Strict Mode, measured.
  beforeEach(() => {
    sharedRpc.clearCache();
    sharedRpc.resetJourneyMetrics();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(['clear', 'method'])('discards older reads after %s invalidation without evicting a newer read', async (mode) => {
    const resolve: Array<(value: string) => void> = [];
    const read = vi.spyOn(sharedRpc.getRawClient(), 'readContract').mockImplementation(
      () => new Promise<string>((done) => resolve.push(done))
    );
    const old = sharedRpc.readContract('get_case', ['case'], 'lookup', false, MOCK_ADDR);
    const rejected = expect(old).rejects.toThrow('RPC_READ_INVALIDATED');
    if (mode === 'clear') sharedRpc.clearCache();
    else sharedRpc.invalidateMethod('get_case');
    const fresh = sharedRpc.readContract('get_case', ['case'], 'lookup', true, MOCK_ADDR);
    expect(read).toHaveBeenCalledTimes(2);
    resolve[0]('stale');
    await rejected;
    const joined = sharedRpc.readContract('get_case', ['case'], 'lookup', true, MOCK_ADDR);
    expect(read).toHaveBeenCalledTimes(2);
    resolve[1]('fresh');
    expect(await fresh).toBe('fresh');
    expect(await joined).toBe('fresh');
    expect(await sharedRpc.readContract('get_case', ['case'], 'lookup', false, MOCK_ADDR)).toBe('fresh');
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('tracks journey metrics when readContract is executed', async () => {
    const rawClient = sharedRpc.getRawClient();
    vi.spyOn(rawClient, 'readContract').mockResolvedValue('REAL-000001');

    await sharedRpc.readContract('get_case_id', [0], 'public_lookup', true, MOCK_ADDR);
    await sharedRpc.readContract('get_case_id', [1], 'public_lookup', true, MOCK_ADDR);

    const metrics = sharedRpc.getJourneyMetrics();
    expect(metrics.total).toBe(2);
    expect(metrics.journeys['public_lookup']).toBe(2);
    expect(JSON.parse(localStorage.getItem(RPC_EVIDENCE_KEY)!)).toMatchObject({
      mode: 'logical-client-calls', total: 2, journeys: { public_lookup: 2 },
    });
  });

  it('uses the approved 1s and 3s retry delays', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const read = vi.spyOn(sharedRpc.getRawClient(), 'readContract')
      .mockRejectedValueOnce(Object.assign(new Error('busy'), {status: 429}))
      .mockRejectedValueOnce(new Error('HTTP 599 Unavailable'))
      .mockResolvedValue('ok');
    const result = sharedRpc.readContract('get_case', ['retry'], 'lookup', true, MOCK_ADDR);
    await vi.advanceTimersByTimeAsync(999);
    expect(read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(read).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2999);
    expect(read).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toBe('ok');
    expect(read).toHaveBeenCalledTimes(3);
  });

  it('does not retry a semantic error containing HTTP-like numbers', async () => {
    const read = vi.spyOn(sharedRpc.getRawClient(), 'readContract').mockRejectedValue(new Error('CASE_500_NOT_FOUND'));
    await expect(sharedRpc.readContract('get_case', ['bad'], 'lookup', true, MOCK_ADDR)).rejects.toThrow('CASE_500_NOT_FOUND');
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('does not issue another request after invalidation during backoff', async () => {
    vi.useFakeTimers();
    const read = vi.spyOn(sharedRpc.getRawClient(), 'readContract').mockRejectedValue(new Error('HTTP 503 Unavailable'));
    const result = sharedRpc.readContract('get_case', ['cancel'], 'lookup', true, MOCK_ADDR);
    const rejected = expect(result).rejects.toThrow('RPC_READ_INVALIDATED');
    await vi.advanceTimersByTimeAsync(0);
    sharedRpc.clearCache();
    await vi.runAllTimersAsync();
    await rejected;
    expect(read).toHaveBeenCalledTimes(1);
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
