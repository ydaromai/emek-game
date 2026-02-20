import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture the cookies config passed to createServerClient
let capturedCookiesConfig: { getAll: () => unknown[]; setAll: (cookies: unknown[]) => void } | null = null;

// Mock cookies from next/headers
const mockGetAll = vi.fn(() => [{ name: 'sb-token', value: 'abc123' }]);
const mockSet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: mockGetAll,
    set: mockSet,
  })),
}));

// Mock @supabase/ssr
const mockServerClient = { auth: {}, from: vi.fn() };
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url: string, _key: string, options: { cookies: typeof capturedCookiesConfig }) => {
    capturedCookiesConfig = options.cookies;
    return mockServerClient;
  }),
}));

// Mock @supabase/supabase-js
const mockAdminClient = { auth: { admin: {} }, from: vi.fn() };
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockAdminClient),
}));

describe('supabase/server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCookiesConfig = null;
  });

  it('createClient returns a supabase server client instance', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const client = await createClient();

    expect(client).toBeDefined();
    expect(client).toBe(mockServerClient);
  });

  it('createClient uses environment variables', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const { createClient } = await import('@/lib/supabase/server');
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      expect.objectContaining({
        cookies: expect.any(Object),
      })
    );
  });

  it('cookie getAll returns cookies from cookie store', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    await createClient();

    expect(capturedCookiesConfig).not.toBeNull();
    const allCookies = capturedCookiesConfig!.getAll();
    expect(allCookies).toEqual([{ name: 'sb-token', value: 'abc123' }]);
    expect(mockGetAll).toHaveBeenCalled();
  });

  it('cookie setAll sets cookies on cookie store', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    await createClient();

    expect(capturedCookiesConfig).not.toBeNull();
    const cookiesToSet = [
      { name: 'sb-token', value: 'new-value', options: { path: '/' } },
    ];
    capturedCookiesConfig!.setAll(cookiesToSet);
    expect(mockSet).toHaveBeenCalledWith('sb-token', 'new-value', { path: '/' });
  });

  it('cookie setAll silently catches errors from Server Components', async () => {
    mockSet.mockImplementation(() => {
      throw new Error('Cannot set cookies in Server Component');
    });

    const { createClient } = await import('@/lib/supabase/server');
    await createClient();

    expect(capturedCookiesConfig).not.toBeNull();
    // Should not throw
    expect(() => {
      capturedCookiesConfig!.setAll([
        { name: 'sb-token', value: 'val', options: {} },
      ]);
    }).not.toThrow();
  });

  // createAdminClient tests are in admin.test.ts (moved to @/lib/supabase/admin)
});
