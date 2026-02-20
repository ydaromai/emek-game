import { describe, it, expect, vi } from 'vitest';

// Mock @supabase/ssr
const mockBrowserClient = { auth: {}, from: vi.fn() };
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => mockBrowserClient),
}));

describe('supabase/client', () => {
  it('createClient returns a supabase browser client instance', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const client = createClient();

    expect(client).toBeDefined();
    expect(client).toBe(mockBrowserClient);
  });

  it('createClient uses environment variables', async () => {
    const { createBrowserClient } = await import('@supabase/ssr');
    const { createClient } = await import('@/lib/supabase/client');
    createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  });
});
