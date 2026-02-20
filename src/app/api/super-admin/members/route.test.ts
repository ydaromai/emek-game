import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

const mockAdminFrom = vi.fn();
const mockAdminAuth = {
  admin: {
    listUsers: vi.fn(),
    createUser: vi.fn(),
  },
};
const mockAdminClient = {
  from: mockAdminFrom,
  auth: mockAdminAuth,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
  createAdminClient: vi.fn(() => mockAdminClient),
}));

function createSingleBuilder(data: unknown, error: unknown = null) {
  const builder: Record<string, unknown> = {};
  ['select', 'eq', 'limit', 'in', 'order', 'insert', 'update'].forEach((m) => {
    builder[m] = vi.fn(() => builder);
  });
  builder.single = vi.fn(() => Promise.resolve({ data, error }));
  return builder;
}

function createListBuilder(data: unknown[]) {
  const builder: Record<string, unknown> = {};
  ['select', 'eq', 'in', 'order', 'insert', 'update'].forEach((m) => {
    builder[m] = vi.fn(() => builder);
  });
  // Returns array, no .single()
  const result = Promise.resolve({ data, error: null });
  Object.assign(builder, {
    then: result.then.bind(result),
    catch: result.catch.bind(result),
  });
  return builder;
}

describe('GET /api/super-admin/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('./route');
    const res = await GET();

    expect(res.status).toBe(401);
  });

  it('returns 403 when not super admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    // profile check - not super admin
    mockAdminFrom.mockReturnValue(createSingleBuilder({ is_super_admin: false }));

    const { GET } = await import('./route');
    const res = await GET();

    expect(res.status).toBe(403);
  });

  it('returns memberships for super admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    let adminCallNum = 0;
    mockAdminFrom.mockImplementation(() => {
      adminCallNum++;
      if (adminCallNum === 1) {
        // profile check
        return createSingleBuilder({ is_super_admin: true });
      }
      if (adminCallNum === 2) {
        // memberships query
        const builder: Record<string, unknown> = {};
        ['select', 'order'].forEach((m) => {
          builder[m] = vi.fn(() => builder);
        });
        const result = Promise.resolve({
          data: [{ user_id: 'u2', tenant_id: 't1', role: 'admin', created_at: '2026-01-01' }],
          error: null,
        });
        Object.assign(builder, { then: result.then.bind(result), catch: result.catch.bind(result) });
        return builder;
      }
      if (adminCallNum === 3) {
        // tenants query
        const builder: Record<string, unknown> = {};
        ['select', 'order'].forEach((m) => {
          builder[m] = vi.fn(() => builder);
        });
        const result = Promise.resolve({
          data: [{ id: 't1', name: 'Park 1' }],
          error: null,
        });
        Object.assign(builder, { then: result.then.bind(result), catch: result.catch.bind(result) });
        return builder;
      }
      // profiles query
      const builder: Record<string, unknown> = {};
      ['select', 'in'].forEach((m) => {
        builder[m] = vi.fn(() => builder);
      });
      const result = Promise.resolve({
        data: [{ user_id: 'u2', email: 'admin@test.com' }],
        error: null,
      });
      Object.assign(builder, { then: result.then.bind(result), catch: result.catch.bind(result) });
      return builder;
    });

    const { GET } = await import('./route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.memberships).toBeDefined();
    expect(json.tenants).toBeDefined();
    expect(json.memberships[0].email).toBe('admin@test.com');
    expect(json.memberships[0].tenant_name).toBe('Park 1');
  });
});

describe('POST /api/super-admin/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/super-admin/members', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', tenant_id: 't1', role: 'admin' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when missing required fields', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockAdminFrom.mockReturnValue(createSingleBuilder({ is_super_admin: true }));

    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/super-admin/members', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when role is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockAdminFrom.mockReturnValue(createSingleBuilder({ is_super_admin: true }));

    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/super-admin/members', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', tenant_id: 't1', role: 'visitor' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 404 when tenant does not exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    let adminCallNum = 0;
    mockAdminFrom.mockImplementation(() => {
      adminCallNum++;
      if (adminCallNum === 1) return createSingleBuilder({ is_super_admin: true });
      // tenant lookup returns null
      return createSingleBuilder(null, { message: 'Not found' });
    });

    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/super-admin/members', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', tenant_id: 'bad-id', role: 'admin' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });
});
