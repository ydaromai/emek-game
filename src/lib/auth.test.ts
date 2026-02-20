import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error('NEXT_REDIRECT');
  },
}));

// Mock supabase server client
const mockGetSession = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getSession: mockGetSession },
  from: mockFrom,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

// Helper to create chainable query builder
function createQueryBuilder(resolvedData: unknown, resolvedError: unknown = null) {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'limit'];
  for (const method of methods) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() =>
    Promise.resolve({ data: resolvedData, error: resolvedError })
  );
  return builder;
}

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSession', () => {
    it('returns session when authenticated', async () => {
      const fakeSession = { user: { id: 'user-1', email: 'a@b.com' } };
      mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

      const { getSession } = await import('@/lib/auth');
      const session = await getSession();

      expect(session).toEqual(fakeSession);
      expect(mockGetSession).toHaveBeenCalled();
    });

    it('returns null when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      const { getSession } = await import('@/lib/auth');
      const session = await getSession();

      expect(session).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('returns session when authenticated', async () => {
      const fakeSession = { user: { id: 'user-1', email: 'a@b.com' } };
      mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

      const { requireAuth } = await import('@/lib/auth');
      const session = await requireAuth();

      expect(session).toEqual(fakeSession);
    });

    it('redirects to /login when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      const { requireAuth } = await import('@/lib/auth');

      await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });

    it('redirects to /login with redirect query param when specified', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      const { requireAuth } = await import('@/lib/auth');

      await expect(requireAuth('/game')).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith(
        '/login?redirect=%2Fgame'
      );
    });
  });

  describe('getProfile', () => {
    it('returns profile for valid user', async () => {
      const fakeProfile = {
        id: 'prof-1',
        user_id: 'user-1',
        full_name: 'Test User',
        is_super_admin: false,
      };
      const qb = createQueryBuilder(fakeProfile);
      mockFrom.mockReturnValue(qb);

      const { getProfile } = await import('@/lib/auth');
      const profile = await getProfile('user-1');

      expect(profile).toEqual(fakeProfile);
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(qb.select).toHaveBeenCalledWith('*');
      expect(qb.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('returns null when profile not found', async () => {
      const qb = createQueryBuilder(null);
      mockFrom.mockReturnValue(qb);

      const { getProfile } = await import('@/lib/auth');
      const profile = await getProfile('nonexistent');

      expect(profile).toBeNull();
    });

    it('scopes by tenant_id when provided', async () => {
      const fakeProfile = { id: 'prof-1', user_id: 'user-1', tenant_id: 'tenant-1' };
      const qb = createQueryBuilder(fakeProfile);
      mockFrom.mockReturnValue(qb);

      const { getProfile } = await import('@/lib/auth');
      await getProfile('user-1', 'tenant-1');

      // eq should be called twice: once for user_id, once for tenant_id
      expect(qb.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(qb.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
    });
  });

  describe('requireAdmin', () => {
    it('returns session, profile, and role for valid admin', async () => {
      const fakeSession = { user: { id: 'user-1' } };
      mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

      const membershipQb = createQueryBuilder(null);
      // Override the single call to return array-like data via the query
      // Actually, requireAdmin does NOT call .single() on memberships
      // It just queries and gets { data: memberships }
      // Let me re-read the code...
      // memberships query: select('role').eq('user_id',...).eq('tenant_id',...)
      // No .single()! It gets { data: memberships }
      // So we need a different mock approach for that query

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'tenant_memberships') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(function() { return this; }),
            })),
          };
        }
        // profiles table
        return createQueryBuilder({
          id: 'prof-1',
          user_id: 'user-1',
          is_super_admin: false,
        });
      });

      // Actually let me reconsider. The memberships query chain is:
      // supabase.from('tenant_memberships').select('role').eq('user_id', ...).eq('tenant_id', ...)
      // This does NOT call .single() so it returns the chainable result directly.
      // But in supabase-js, the final .eq() returns a Promise-like with { data, error }
      // Let me create proper mocks.

      const membershipsBuilder: Record<string, unknown> = {};
      membershipsBuilder.select = vi.fn(() => membershipsBuilder);
      membershipsBuilder.eq = vi.fn(() => membershipsBuilder);
      // The chain ends without .single(), so supabase returns the builder
      // which resolves to { data, error } when awaited (it's a PromiseLike)
      membershipsBuilder.then = vi.fn((resolve: (value: unknown) => void) =>
        resolve({ data: [{ role: 'admin' }], error: null })
      );

      const profileBuilder = createQueryBuilder({
        id: 'prof-1',
        user_id: 'user-1',
        is_super_admin: false,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tenant_memberships') return membershipsBuilder;
        return profileBuilder; // profiles
      });

      const { requireAdmin } = await import('@/lib/auth');
      const result = await requireAdmin('tenant-1');

      expect(result.role).toBe('admin');
      expect(result.session).toEqual(fakeSession);
    });

    it('redirects non-admin users without membership or super_admin', async () => {
      const fakeSession = { user: { id: 'user-1' } };
      mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

      const membershipsBuilder: Record<string, unknown> = {};
      membershipsBuilder.select = vi.fn(() => membershipsBuilder);
      membershipsBuilder.eq = vi.fn(() => membershipsBuilder);
      membershipsBuilder.then = vi.fn((resolve: (value: unknown) => void) =>
        resolve({ data: [], error: null })
      );

      const profileBuilder = createQueryBuilder({
        id: 'prof-1',
        user_id: 'user-1',
        is_super_admin: false,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tenant_memberships') return membershipsBuilder;
        return profileBuilder;
      });

      const { requireAdmin } = await import('@/lib/auth');

      await expect(requireAdmin('tenant-1')).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/admin/login');
    });

    it('returns super_admin role when user is super admin with no membership', async () => {
      const fakeSession = { user: { id: 'user-1' } };
      mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

      const membershipsBuilder: Record<string, unknown> = {};
      membershipsBuilder.select = vi.fn(() => membershipsBuilder);
      membershipsBuilder.eq = vi.fn(() => membershipsBuilder);
      membershipsBuilder.then = vi.fn((resolve: (value: unknown) => void) =>
        resolve({ data: [], error: null })
      );

      const profileBuilder = createQueryBuilder({
        id: 'prof-1',
        user_id: 'user-1',
        is_super_admin: true,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tenant_memberships') return membershipsBuilder;
        return profileBuilder;
      });

      const { requireAdmin } = await import('@/lib/auth');
      const result = await requireAdmin('tenant-1');

      expect(result.role).toBe('super_admin');
    });
  });

  describe('requireSuperAdmin', () => {
    it('returns session for super admin', async () => {
      const fakeSession = { user: { id: 'user-1' } };
      mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

      const qb = createQueryBuilder({ is_super_admin: true });
      mockFrom.mockReturnValue(qb);

      const { requireSuperAdmin } = await import('@/lib/auth');
      const session = await requireSuperAdmin();

      expect(session).toEqual(fakeSession);
      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('redirects non-super-admin', async () => {
      const fakeSession = { user: { id: 'user-1' } };
      mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

      const qb = createQueryBuilder({ is_super_admin: false });
      mockFrom.mockReturnValue(qb);

      const { requireSuperAdmin } = await import('@/lib/auth');

      await expect(requireSuperAdmin()).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/super-admin/login');
    });

    it('redirects when profile not found', async () => {
      const fakeSession = { user: { id: 'user-1' } };
      mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

      const qb = createQueryBuilder(null);
      mockFrom.mockReturnValue(qb);

      const { requireSuperAdmin } = await import('@/lib/auth');

      await expect(requireSuperAdmin()).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/super-admin/login');
    });
  });
});
