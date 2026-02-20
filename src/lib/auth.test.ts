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
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
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

  describe('getAuthUser', () => {
    it('returns user when authenticated', async () => {
      const fakeUser = { id: 'user-1', email: 'a@b.com' };
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

      const { getAuthUser } = await import('@/lib/auth');
      const user = await getAuthUser();

      expect(user).toEqual(fakeUser);
      expect(mockGetUser).toHaveBeenCalled();
    });

    it('returns null when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { getAuthUser } = await import('@/lib/auth');
      const user = await getAuthUser();

      expect(user).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('returns user when authenticated', async () => {
      const fakeUser = { id: 'user-1', email: 'a@b.com' };
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

      const { requireAuth } = await import('@/lib/auth');
      const user = await requireAuth();

      expect(user).toEqual(fakeUser);
    });

    it('redirects to /login when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { requireAuth } = await import('@/lib/auth');

      await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });

    it('redirects to /login with redirect query param when specified', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

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
    it('returns user, profile, and role for valid admin', async () => {
      const fakeUser = { id: 'user-1' };
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

      const membershipsBuilder: Record<string, unknown> = {};
      membershipsBuilder.select = vi.fn(() => membershipsBuilder);
      membershipsBuilder.eq = vi.fn(() => membershipsBuilder);
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
      expect(result.user).toEqual(fakeUser);
    });

    it('redirects non-admin users without membership or super_admin', async () => {
      const fakeUser = { id: 'user-1' };
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

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
      const fakeUser = { id: 'user-1' };
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

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
    it('returns user for super admin', async () => {
      const fakeUser = { id: 'user-1' };
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

      const qb = createQueryBuilder({ is_super_admin: true });
      mockFrom.mockReturnValue(qb);

      const { requireSuperAdmin } = await import('@/lib/auth');
      const user = await requireSuperAdmin();

      expect(user).toEqual(fakeUser);
      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('redirects non-super-admin', async () => {
      const fakeUser = { id: 'user-1' };
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

      const qb = createQueryBuilder({ is_super_admin: false });
      mockFrom.mockReturnValue(qb);

      const { requireSuperAdmin } = await import('@/lib/auth');

      await expect(requireSuperAdmin()).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/super-admin/login');
    });

    it('redirects when profile not found', async () => {
      const fakeUser = { id: 'user-1' };
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

      const qb = createQueryBuilder(null);
      mockFrom.mockReturnValue(qb);

      const { requireSuperAdmin } = await import('@/lib/auth');

      await expect(requireSuperAdmin()).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/super-admin/login');
    });
  });
});
