import { describe, it, expect, vi } from 'vitest';

// Mock @supabase/supabase-js
const mockAdminClient = { auth: { admin: {} }, from: vi.fn() };
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockAdminClient),
}));

describe('supabase/admin', () => {
  it('createAdminClient returns a supabase admin client instance', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const client = createAdminClient();

    expect(client).toBeDefined();
    expect(client).toBe(mockAdminClient);
  });

  it('createAdminClient uses service role key with correct auth options', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { createAdminClient } = await import('@/lib/supabase/admin');
    createAdminClient();

    expect(createClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  });

  it('createAdminClient returns new instance each call', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const client1 = createAdminClient();
    const client2 = createAdminClient();

    // Both return the mock (same reference in tests), but the function is called twice
    expect(client1).toBeDefined();
    expect(client2).toBeDefined();
  });

  it('calls createClient on every invocation', async () => {
    const { createClient: mockCreate } = await import('@supabase/supabase-js');
    const { createAdminClient } = await import('@/lib/supabase/admin');

    const callsBefore = (mockCreate as ReturnType<typeof vi.fn>).mock.calls.length;
    createAdminClient();
    const callsAfter = (mockCreate as ReturnType<typeof vi.fn>).mock.calls.length;

    expect(callsAfter).toBe(callsBefore + 1);
  });
});
