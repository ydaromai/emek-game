import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

// Mock tenant
const mockGetTenant = vi.fn();
vi.mock('@/lib/tenant', () => ({
  getTenant: (...args: unknown[]) => mockGetTenant(...args),
}));

// Chainable builder for complex queries
function createChainableBuilder(finalData: unknown) {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'or', 'order'];
  for (const m of methods) {
    builder[m] = vi.fn(() => builder);
  }
  const result = Promise.resolve({ data: finalData, error: null });
  Object.assign(builder, {
    then: result.then.bind(result),
    catch: result.catch.bind(result),
  });
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

describe('GET /api/admin/export/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/export/users');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when no tenant slug', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
    });
    mockHeadersGet.mockReturnValue(null);

    const { GET } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/export/users');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('returns 403 when user is not admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park' });

    // non-admin membership
    const membershipBuilder = createMembershipBuilder({ role: 'staff' });
    mockFrom.mockReturnValue(membershipBuilder);

    const { GET } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/export/users');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('returns CSV with UTF-8 BOM for admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park' });

    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) {
        return createMembershipBuilder({ role: 'admin' });
      }
      // Users query - returns thenable builder
      const users = [
        {
          full_name: 'Test User',
          phone: '0501234567',
          email: 'test@test.com',
          completion_status: 'completed',
          completed_at: '2026-02-20T10:00:00Z',
          created_at: '2026-02-19T10:00:00Z',
        },
      ];
      return createChainableBuilder(users);
    });

    const { GET } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/export/users');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('users-export.csv');

    // Check raw bytes for UTF-8 BOM (EF BB BF)
    const buffer = await res.clone().arrayBuffer();
    const bytes = new Uint8Array(buffer);
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);

    const text = await res.text();
    // Check header row
    expect(text).toContain('שם,טלפון,אימייל,סטטוס');
    // Check data row
    expect(text).toContain('Test User');
  });

  it('applies search filter when provided', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park' });

    const orMock = vi.fn();
    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) {
        return createMembershipBuilder({ role: 'admin' });
      }
      const builder = createChainableBuilder([]);
      builder.or = orMock.mockReturnValue(builder);
      return builder;
    });

    const { GET } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/export/users?search=john');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(orMock).toHaveBeenCalled();
  });
});
