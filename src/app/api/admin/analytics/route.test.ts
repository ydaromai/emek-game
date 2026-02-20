import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers
const mockHeadersGet = vi.fn();
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: mockHeadersGet })),
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
const mockGetTenant = vi.fn();
vi.mock('@/lib/tenant', () => ({
  getTenant: (...args: unknown[]) => mockGetTenant(...args),
}));

// Query builder helpers
function createCountBuilder(count: number) {
  const builder: Record<string, unknown> = {};
  ['select', 'eq'].forEach((m) => {
    builder[m] = vi.fn(() => builder);
  });
  builder.single = vi.fn(() => Promise.resolve({ count, data: null, error: null }));
  return builder;
}

function createMembershipBuilder(data: unknown) {
  const builder: Record<string, unknown> = {};
  ['select', 'eq'].forEach((m) => {
    builder[m] = vi.fn(() => builder);
  });
  builder.single = vi.fn(() => Promise.resolve({ data, error: null }));
  return builder;
}

describe('GET /api/admin/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { GET } = await import('./route');
    const res = await GET();

    expect(res.status).toBe(401);
  });

  it('returns 400 when no tenant slug', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue(null);

    const { GET } = await import('./route');
    const res = await GET();

    expect(res.status).toBe(400);
  });

  it('returns 404 when tenant not found', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('bad-slug');
    mockGetTenant.mockResolvedValue(null);

    const { GET } = await import('./route');
    const res = await GET();

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not admin/staff', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park' });

    const membershipBuilder = createMembershipBuilder(null);
    mockFrom.mockReturnValue(membershipBuilder);

    const { GET } = await import('./route');
    const res = await GET();

    expect(res.status).toBe(403);
  });

  it('returns analytics data for admin', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park' });

    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) {
        // membership check
        return createMembershipBuilder({ role: 'admin' });
      }
      if (callNum === 2) {
        // total users count
        const b: Record<string, unknown> = {};
        ['select', 'eq'].forEach((m) => { b[m] = vi.fn(() => b); });
        // Simulate count response
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ count: 50, data: null, error: null })) })) })) };
      }
      if (callNum === 3) {
        // completed users count
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ count: 10, data: null, error: null })) })) })) })) };
      }
      // checkpoint distribution
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })) };
    });

    const { GET } = await import('./route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty('totalUsers');
    expect(json).toHaveProperty('completedUsers');
    expect(json).toHaveProperty('completionRate');
    expect(json).toHaveProperty('distribution');
  });
});
