import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error('NEXT_REDIRECT');
  },
}));

// Mock supabase
const mockGetSession = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getSession: mockGetSession },
  from: mockFrom,
};
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

// Mock tenant
const mockResolveTenant = vi.fn();
vi.mock('@/lib/tenant', () => ({
  resolveTenant: () => mockResolveTenant(),
}));

// Mock FloatingParticles component
vi.mock('@/components/FloatingParticles', () => ({
  default: () => null,
}));

function createQueryBuilder(data: unknown) {
  const builder: Record<string, unknown> = {};
  ['select', 'eq', 'maybeSingle'].forEach((m) => {
    builder[m] = vi.fn(() => builder);
  });
  builder.single = vi.fn(() => Promise.resolve({ data, error: null }));
  return builder;
}

function createUpsertBuilder() {
  return {
    upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };
}

describe('ScanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error for invalid UUID token', async () => {
    const ScanPage = (await import('./page')).default;
    const result = await ScanPage({ params: Promise.resolve({ token: 'not-a-uuid' }) });

    // Should render error UI, not redirect
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('redirects to login when not authenticated', async () => {
    mockResolveTenant.mockResolvedValue({ id: 't1', name: 'Park', is_active: true });
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const ScanPage = (await import('./page')).default;
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    await expect(
      ScanPage({ params: Promise.resolve({ token: validUUID }) })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/login')
    );
  });

  it('renders error when animal not found for tenant', async () => {
    mockResolveTenant.mockResolvedValue({ id: 't1', name: 'Park', is_active: true });
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });

    // Animal query returns null
    const animalBuilder = createQueryBuilder(null);
    mockFrom.mockReturnValue(animalBuilder);

    const ScanPage = (await import('./page')).default;
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const result = await ScanPage({ params: Promise.resolve({ token: validUUID }) });

    expect(result).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('renders error when animal is inactive', async () => {
    mockResolveTenant.mockResolvedValue({ id: 't1', name: 'Park', is_active: true });
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });

    const animalBuilder = createQueryBuilder({
      id: 'a1',
      is_active: false,
      tenant_id: 't1',
      letter: 'א',
    });
    mockFrom.mockReturnValue(animalBuilder);

    const ScanPage = (await import('./page')).default;
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const result = await ScanPage({ params: Promise.resolve({ token: validUUID }) });

    expect(result).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('records progress and redirects for valid scan', async () => {
    mockResolveTenant.mockResolvedValue({ id: 't1', name: 'Park', is_active: true });
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });

    const animal = {
      id: 'a1',
      is_active: true,
      tenant_id: 't1',
      letter: 'א',
    };

    // First call: animal query
    const animalBuilder = createQueryBuilder(animal);
    // Second call: existing progress check
    const progressBuilder: Record<string, unknown> = {};
    ['select', 'eq'].forEach((m) => {
      progressBuilder[m] = vi.fn(() => progressBuilder);
    });
    progressBuilder.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
    // Third call: upsert
    const upsertBuilder = {
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };

    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) return animalBuilder;
      if (callNum === 2) return progressBuilder;
      return upsertBuilder;
    });

    const ScanPage = (await import('./page')).default;
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    await expect(
      ScanPage({ params: Promise.resolve({ token: validUUID }) })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/animal/a1?new=true');
  });

  it('redirects without ?new=true for repeat scan', async () => {
    mockResolveTenant.mockResolvedValue({ id: 't1', name: 'Park', is_active: true });
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });

    const animal = {
      id: 'a1',
      is_active: true,
      tenant_id: 't1',
      letter: 'א',
    };

    const animalBuilder = createQueryBuilder(animal);
    const progressBuilder: Record<string, unknown> = {};
    ['select', 'eq'].forEach((m) => {
      progressBuilder[m] = vi.fn(() => progressBuilder);
    });
    progressBuilder.maybeSingle = vi.fn(() =>
      Promise.resolve({ data: { id: 'existing' }, error: null })
    );
    const upsertBuilder = {
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    };

    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) return animalBuilder;
      if (callNum === 2) return progressBuilder;
      return upsertBuilder;
    });

    const ScanPage = (await import('./page')).default;
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    await expect(
      ScanPage({ params: Promise.resolve({ token: validUUID }) })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/animal/a1');
  });
});
