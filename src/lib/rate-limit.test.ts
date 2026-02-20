import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset the module to clear the rateStore Map between tests
    vi.resetModules();
  });

  it('allows requests within limit', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');

    expect(rateLimit('test-key', 3, 60000)).toBe(true);
    expect(rateLimit('test-key', 3, 60000)).toBe(true);
    expect(rateLimit('test-key', 3, 60000)).toBe(true);
  });

  it('blocks requests over limit', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');

    expect(rateLimit('test-key', 2, 60000)).toBe(true);
    expect(rateLimit('test-key', 2, 60000)).toBe(true);
    // Third request should be blocked
    expect(rateLimit('test-key', 2, 60000)).toBe(false);
  });

  it('resets after window expires', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');

    const originalNow = Date.now;

    // Start at time 1000
    let currentTime = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    expect(rateLimit('test-key', 1, 5000)).toBe(true);
    // Should be blocked
    expect(rateLimit('test-key', 1, 5000)).toBe(false);

    // Advance time past the window
    currentTime = 7000;
    // Should be allowed again
    expect(rateLimit('test-key', 1, 5000)).toBe(true);

    Date.now = originalNow;
  });

  it('tracks different keys independently', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');

    expect(rateLimit('key-a', 1, 60000)).toBe(true);
    expect(rateLimit('key-a', 1, 60000)).toBe(false);
    // Different key should still be allowed
    expect(rateLimit('key-b', 1, 60000)).toBe(true);
  });

  it('sets count to 1 on first request', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');

    // First request with limit of 1 should succeed
    expect(rateLimit('fresh-key', 1, 60000)).toBe(true);
    // Second should fail since limit is 1
    expect(rateLimit('fresh-key', 1, 60000)).toBe(false);
  });
});
