import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers
const mockGet = vi.fn();
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: mockGet,
  })),
}));

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error('NEXT_REDIRECT');
  },
}));

// Mock supabase server client
const mockFrom = vi.fn();
const mockSupabase = {
  from: mockFrom,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

// Helper to create chainable query builder
function createQueryBuilder(resolvedData: unknown, resolvedError: unknown = null) {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'eq'];
  for (const method of methods) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() =>
    Promise.resolve({ data: resolvedData, error: resolvedError })
  );
  return builder;
}

describe('tenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache so React.cache creates fresh instances
    vi.resetModules();
  });

  describe('getTenantSlug', () => {
    it('returns slug from x-tenant-slug header', async () => {
      mockGet.mockReturnValue('park-a');

      const { getTenantSlug } = await import('@/lib/tenant');
      const slug = await getTenantSlug();

      expect(slug).toBe('park-a');
      expect(mockGet).toHaveBeenCalledWith('x-tenant-slug');
    });

    it('returns null when header is not set', async () => {
      mockGet.mockReturnValue(null);

      const { getTenantSlug } = await import('@/lib/tenant');
      const slug = await getTenantSlug();

      expect(slug).toBeNull();
    });
  });

  describe('getTenant', () => {
    it('returns tenant for valid slug', async () => {
      const fakeTenant = {
        id: 'tenant-1',
        name: 'Park A',
        slug: 'park-a',
        is_active: true,
      };
      const qb = createQueryBuilder(fakeTenant);
      mockFrom.mockReturnValue(qb);

      const { getTenant } = await import('@/lib/tenant');
      const tenant = await getTenant('park-a');

      expect(tenant).toEqual(fakeTenant);
      expect(mockFrom).toHaveBeenCalledWith('tenants');
      expect(qb.eq).toHaveBeenCalledWith('slug', 'park-a');
      expect(qb.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('returns null for non-existent slug', async () => {
      const qb = createQueryBuilder(null);
      mockFrom.mockReturnValue(qb);

      const { getTenant } = await import('@/lib/tenant');
      const tenant = await getTenant('non-existent');

      expect(tenant).toBeNull();
    });
  });

  describe('getTenantOrNotFound', () => {
    it('returns tenant when found', async () => {
      const fakeTenant = { id: 'tenant-1', slug: 'park-a', is_active: true };
      const qb = createQueryBuilder(fakeTenant);
      mockFrom.mockReturnValue(qb);

      const { getTenantOrNotFound } = await import('@/lib/tenant');
      const tenant = await getTenantOrNotFound('park-a');

      expect(tenant).toEqual(fakeTenant);
    });

    it('redirects to /tenant-not-found when tenant not found', async () => {
      const qb = createQueryBuilder(null);
      mockFrom.mockReturnValue(qb);

      const { getTenantOrNotFound } = await import('@/lib/tenant');

      await expect(getTenantOrNotFound('bad-slug')).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/tenant-not-found');
    });
  });

  describe('resolveTenant', () => {
    it('returns tenant for active tenant slug in headers', async () => {
      mockGet.mockReturnValue('park-a');
      const fakeTenant = { id: 'tenant-1', slug: 'park-a', is_active: true };
      const qb = createQueryBuilder(fakeTenant);
      mockFrom.mockReturnValue(qb);

      const { resolveTenant } = await import('@/lib/tenant');
      const tenant = await resolveTenant();

      expect(tenant).toEqual(fakeTenant);
    });

    it('returns null when no slug (bare domain)', async () => {
      mockGet.mockReturnValue(null);

      const { resolveTenant } = await import('@/lib/tenant');
      const tenant = await resolveTenant();

      expect(tenant).toBeNull();
    });

    it('returns null when tenant not found for slug', async () => {
      mockGet.mockReturnValue('non-existent');
      const qb = createQueryBuilder(null);
      mockFrom.mockReturnValue(qb);

      const { resolveTenant } = await import('@/lib/tenant');
      const tenant = await resolveTenant();

      expect(tenant).toBeNull();
    });
  });
});
