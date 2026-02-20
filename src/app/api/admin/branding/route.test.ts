import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers
const mockHeadersGet = vi.fn();
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: mockHeadersGet })),
}));

// Mock supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

// Mock admin client
const mockAdminFrom = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: mockAdminFrom })),
}));

// Mock tenant
const mockGetTenant = vi.fn();
vi.mock('@/lib/tenant', () => ({
  getTenant: (...args: unknown[]) => mockGetTenant(...args),
}));

function createSingleBuilder(data: unknown, error: unknown = null) {
  const builder: Record<string, unknown> = {};
  ['select', 'eq', 'update', 'limit'].forEach((m) => {
    builder[m] = vi.fn(() => builder);
  });
  builder.single = vi.fn(() => Promise.resolve({ data, error }));
  return builder;
}

describe('GET /api/admin/branding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('./route');
    const res = await GET();

    expect(res.status).toBe(401);
  });

  it('returns 400 when no tenant slug', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockHeadersGet.mockReturnValue(null);

    const { GET } = await import('./route');
    const res = await GET();

    expect(res.status).toBe(400);
  });

  it('returns 403 when user is not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park', branding: {} });

    // membership check - no admin role
    const membershipBuilder = createSingleBuilder(null);
    // profile check - not super admin
    const profileBuilder = createSingleBuilder({ is_super_admin: false });

    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) return membershipBuilder;
      return profileBuilder;
    });

    const { GET } = await import('./route');
    const res = await GET();

    expect(res.status).toBe(403);
  });

  it('returns branding for admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockHeadersGet.mockReturnValue('park-slug');
    const testBranding = { primary: '#1a8a6e', accent: '#4ecdc4' };
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park', branding: testBranding });

    // membership check - admin
    const membershipBuilder = createSingleBuilder({ role: 'admin' });
    // profile check
    const profileBuilder = createSingleBuilder({ is_super_admin: false });

    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) return membershipBuilder;
      return profileBuilder;
    });

    const { GET } = await import('./route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.branding).toEqual(testBranding);
  });
});

describe('PATCH /api/admin/branding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { PATCH } = await import('./route');
    const req = new Request('http://localhost/api/admin/branding', {
      method: 'PATCH',
      body: JSON.stringify({ branding: {} }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when branding is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park', branding: {} });

    const membershipBuilder = createSingleBuilder({ role: 'admin' });
    const profileBuilder = createSingleBuilder({ is_super_admin: false });

    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) return membershipBuilder;
      return profileBuilder;
    });

    const { PATCH } = await import('./route');
    const req = new Request('http://localhost/api/admin/branding', {
      method: 'PATCH',
      body: JSON.stringify({ branding: null }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);

    expect(res.status).toBe(400);
  });

  it('saves valid branding and returns updated data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park', branding: {} });

    const membershipBuilder = createSingleBuilder({ role: 'admin' });
    const profileBuilder = createSingleBuilder({ is_super_admin: false });

    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) return membershipBuilder;
      return profileBuilder;
    });

    const updatedBranding = { primary: '#ff0000', accent: '#00ff00' };
    mockAdminFrom.mockReturnValue(
      createSingleBuilder({ branding: updatedBranding })
    );

    const { PATCH } = await import('./route');
    const req = new Request('http://localhost/api/admin/branding', {
      method: 'PATCH',
      body: JSON.stringify({ branding: updatedBranding }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.branding).toEqual(updatedBranding);
  });
});
