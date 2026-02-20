import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper to create chainable query builder for single queries
function createSingleQueryBuilder(resolvedData: unknown, resolvedError: unknown = null) {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order'];
  for (const method of methods) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() =>
    Promise.resolve({ data: resolvedData, error: resolvedError })
  );
  // Also make it thenable for queries without .single()
  builder.then = vi.fn((resolve: (value: unknown) => void) =>
    resolve({ data: resolvedData, error: resolvedError })
  );
  return builder;
}

// Helper to create chainable query builder for list queries
function createListQueryBuilder(resolvedData: unknown[], resolvedError: unknown = null) {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order'];
  for (const method of methods) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = vi.fn((resolve: (value: unknown) => void) =>
    resolve({ data: resolvedData, error: resolvedError })
  );
  return builder;
}

describe('tenant-queries', () => {
  let mockSupabase: { from: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = { from: vi.fn() };
  });

  describe('getAnimals', () => {
    it('returns active animals for tenant ordered by order_index', async () => {
      const fakeAnimals = [
        { id: 'a1', name: 'Lion', tenant_id: 't1', order_index: 1, is_active: true },
        { id: 'a2', name: 'Tiger', tenant_id: 't1', order_index: 2, is_active: true },
      ];
      const qb = createListQueryBuilder(fakeAnimals);
      mockSupabase.from.mockReturnValue(qb);

      const { getAnimals } = await import('@/lib/supabase/tenant-queries');
      const result = await getAnimals(mockSupabase as unknown as SupabaseClient, 't1');

      expect(result).toEqual(fakeAnimals);
      expect(mockSupabase.from).toHaveBeenCalledWith('animals');
      expect(qb.eq).toHaveBeenCalledWith('tenant_id', 't1');
      expect(qb.eq).toHaveBeenCalledWith('is_active', true);
      expect(qb.order).toHaveBeenCalledWith('order_index');
    });

    it('throws on error', async () => {
      const qb = createListQueryBuilder([], { message: 'DB error', code: '500' });
      mockSupabase.from.mockReturnValue(qb);

      const { getAnimals } = await import('@/lib/supabase/tenant-queries');

      await expect(getAnimals(mockSupabase as unknown as SupabaseClient, 't1'))
        .rejects.toEqual({ message: 'DB error', code: '500' });
    });
  });

  describe('getProfile', () => {
    it('returns profile for user and tenant', async () => {
      const fakeProfile = { id: 'p1', user_id: 'u1', tenant_id: 't1', full_name: 'Test' };
      const qb = createSingleQueryBuilder(fakeProfile);
      mockSupabase.from.mockReturnValue(qb);

      const { getProfile } = await import('@/lib/supabase/tenant-queries');
      const result = await getProfile(mockSupabase as unknown as SupabaseClient, 'u1', 't1');

      expect(result).toEqual(fakeProfile);
      expect(qb.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(qb.eq).toHaveBeenCalledWith('tenant_id', 't1');
    });

    it('returns null when profile not found (PGRST116)', async () => {
      const qb = createSingleQueryBuilder(null, { code: 'PGRST116', message: 'not found' });
      mockSupabase.from.mockReturnValue(qb);

      const { getProfile } = await import('@/lib/supabase/tenant-queries');
      const result = await getProfile(mockSupabase as unknown as SupabaseClient, 'u1', 't1');

      expect(result).toBeNull();
    });

    it('throws on non-PGRST116 error', async () => {
      const qb = createSingleQueryBuilder(null, { code: '500', message: 'server error' });
      mockSupabase.from.mockReturnValue(qb);

      const { getProfile } = await import('@/lib/supabase/tenant-queries');

      await expect(getProfile(mockSupabase as unknown as SupabaseClient, 'u1', 't1'))
        .rejects.toEqual({ code: '500', message: 'server error' });
    });
  });

  describe('getProgress', () => {
    it('returns user progress for tenant', async () => {
      const fakeProgress = [
        { id: 'pr1', user_id: 'u1', tenant_id: 't1', animal_id: 'a1', letter: 'A' },
      ];
      const qb = createListQueryBuilder(fakeProgress);
      mockSupabase.from.mockReturnValue(qb);

      const { getProgress } = await import('@/lib/supabase/tenant-queries');
      const result = await getProgress(mockSupabase as unknown as SupabaseClient, 'u1', 't1');

      expect(result).toEqual(fakeProgress);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_progress');
    });

    it('throws on error', async () => {
      const qb = createListQueryBuilder([], { message: 'error' });
      mockSupabase.from.mockReturnValue(qb);

      const { getProgress } = await import('@/lib/supabase/tenant-queries');

      await expect(getProgress(mockSupabase as unknown as SupabaseClient, 'u1', 't1'))
        .rejects.toEqual({ message: 'error' });
    });
  });

  describe('getRedemption', () => {
    it('returns redemption for user and tenant', async () => {
      const fakeRedemption = { id: 'r1', user_id: 'u1', tenant_id: 't1', redemption_code: 'ABC' };
      const qb = createSingleQueryBuilder(fakeRedemption);
      mockSupabase.from.mockReturnValue(qb);

      const { getRedemption } = await import('@/lib/supabase/tenant-queries');
      const result = await getRedemption(mockSupabase as unknown as SupabaseClient, 'u1', 't1');

      expect(result).toEqual(fakeRedemption);
    });

    it('returns null when no redemption found (PGRST116)', async () => {
      const qb = createSingleQueryBuilder(null, { code: 'PGRST116', message: 'not found' });
      mockSupabase.from.mockReturnValue(qb);

      const { getRedemption } = await import('@/lib/supabase/tenant-queries');
      const result = await getRedemption(mockSupabase as unknown as SupabaseClient, 'u1', 't1');

      expect(result).toBeNull();
    });

    it('throws on non-PGRST116 error', async () => {
      const qb = createSingleQueryBuilder(null, { code: '500', message: 'server error' });
      mockSupabase.from.mockReturnValue(qb);

      const { getRedemption } = await import('@/lib/supabase/tenant-queries');

      await expect(getRedemption(mockSupabase as unknown as SupabaseClient, 'u1', 't1'))
        .rejects.toEqual({ code: '500', message: 'server error' });
    });
  });

  describe('getSiteContent', () => {
    it('returns site content for tenant', async () => {
      const fakeContent = [
        { id: 'sc1', tenant_id: 't1', content_key: 'title', content_value: 'Hello' },
      ];
      const qb = createListQueryBuilder(fakeContent);
      mockSupabase.from.mockReturnValue(qb);

      const { getSiteContent } = await import('@/lib/supabase/tenant-queries');
      const result = await getSiteContent(mockSupabase as unknown as SupabaseClient, 't1');

      expect(result).toEqual(fakeContent);
      expect(mockSupabase.from).toHaveBeenCalledWith('site_content');
    });

    it('throws on error', async () => {
      const qb = createListQueryBuilder([], { message: 'error' });
      mockSupabase.from.mockReturnValue(qb);

      const { getSiteContent } = await import('@/lib/supabase/tenant-queries');

      await expect(getSiteContent(mockSupabase as unknown as SupabaseClient, 't1'))
        .rejects.toEqual({ message: 'error' });
    });
  });

  describe('getSiteContentByKey', () => {
    it('returns content value for specific key', async () => {
      const qb = createSingleQueryBuilder({ content_value: 'My Title' });
      mockSupabase.from.mockReturnValue(qb);

      const { getSiteContentByKey } = await import('@/lib/supabase/tenant-queries');
      const result = await getSiteContentByKey(mockSupabase as unknown as SupabaseClient, 't1', 'title');

      expect(result).toBe('My Title');
      expect(qb.eq).toHaveBeenCalledWith('content_key', 'title');
    });

    it('returns null when key not found (PGRST116)', async () => {
      const qb = createSingleQueryBuilder(null, { code: 'PGRST116', message: 'not found' });
      mockSupabase.from.mockReturnValue(qb);

      const { getSiteContentByKey } = await import('@/lib/supabase/tenant-queries');
      const result = await getSiteContentByKey(mockSupabase as unknown as SupabaseClient, 't1', 'unknown');

      expect(result).toBeNull();
    });

    it('throws on non-PGRST116 error', async () => {
      const qb = createSingleQueryBuilder(null, { code: '500', message: 'server error' });
      mockSupabase.from.mockReturnValue(qb);

      const { getSiteContentByKey } = await import('@/lib/supabase/tenant-queries');

      await expect(getSiteContentByKey(mockSupabase as unknown as SupabaseClient, 't1', 'key'))
        .rejects.toEqual({ code: '500', message: 'server error' });
    });
  });
});
