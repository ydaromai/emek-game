import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// Helper to create chainable query builder for list queries (no .single())
function createListQueryBuilder(resolvedData: unknown, resolvedError: unknown = null) {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'eq'];
  for (const method of methods) {
    builder[method] = vi.fn(() => builder);
  }
  // Make the builder itself thenable to resolve when awaited
  builder.then = vi.fn((resolve: (value: unknown) => void) =>
    resolve({ data: resolvedData, error: resolvedError })
  );
  return builder;
}

describe('site-content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSiteContent', () => {
    it('returns DB value when available', async () => {
      const qb = createQueryBuilder({ content_value: 'Custom Title' });
      mockFrom.mockReturnValue(qb);

      const { getSiteContent } = await import('@/lib/site-content');
      const result = await getSiteContent('landing_title');

      expect(result).toBe('Custom Title');
      expect(mockFrom).toHaveBeenCalledWith('site_content');
      expect(qb.eq).toHaveBeenCalledWith('content_key', 'landing_title');
    });

    it('returns default when DB has no entry', async () => {
      const qb = createQueryBuilder(null);
      mockFrom.mockReturnValue(qb);

      const { getSiteContent } = await import('@/lib/site-content');
      const result = await getSiteContent('landing_title');

      expect(result).toBe('פארק המעיינות');
    });

    it('returns default when DB throws error', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('DB error');
      });

      const { getSiteContent } = await import('@/lib/site-content');
      const result = await getSiteContent('landing_title');

      expect(result).toBe('פארק המעיינות');
    });

    it('returns empty string for unknown key with no DB entry', async () => {
      const qb = createQueryBuilder(null);
      mockFrom.mockReturnValue(qb);

      const { getSiteContent } = await import('@/lib/site-content');
      const result = await getSiteContent('unknown_key');

      expect(result).toBe('');
    });

    it('scopes by tenant_id when provided', async () => {
      const qb = createQueryBuilder({ content_value: 'Tenant Title' });
      mockFrom.mockReturnValue(qb);

      const { getSiteContent } = await import('@/lib/site-content');
      await getSiteContent('landing_title', 'tenant-1');

      expect(qb.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
    });
  });

  describe('getAllSiteContent', () => {
    it('returns merged defaults and DB values', async () => {
      const qb = createListQueryBuilder([
        { content_key: 'landing_title', content_value: 'Custom Title' },
      ]);
      mockFrom.mockReturnValue(qb);

      const { getAllSiteContent } = await import('@/lib/site-content');
      const result = await getAllSiteContent();

      expect(result.landing_title).toBe('Custom Title');
      // Other defaults should still be present
      expect(result.landing_subtitle).toBe('מסע חיות הבר');
    });

    it('returns only defaults when DB query fails', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('DB error');
      });

      const { getAllSiteContent } = await import('@/lib/site-content');
      const result = await getAllSiteContent();

      expect(result.landing_title).toBe('פארק המעיינות');
      expect(result.landing_subtitle).toBe('מסע חיות הבר');
    });
  });
});
