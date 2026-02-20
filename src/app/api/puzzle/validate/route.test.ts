import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next/headers
const mockHeadersGet = vi.fn();
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: mockHeadersGet })),
}));

// Mock supabase server
const mockGetSession = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getSession: mockGetSession },
  from: mockFrom,
};
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

// Mock admin client
const mockAdminFrom = vi.fn();
const mockAdminClient = { from: mockAdminFrom };
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

// Mock tenant
const mockGetTenant = vi.fn();
vi.mock('@/lib/tenant', () => ({
  getTenant: (...args: unknown[]) => mockGetTenant(...args),
}));

// Query builder helper
function createQueryBuilder(data: unknown, error: unknown = null) {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'insert', 'update'];
  for (const method of methods) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve({ data, error }));
  builder.maybeSingle = vi.fn(() => Promise.resolve({ data, error }));
  return builder;
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/puzzle/validate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/puzzle/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ answer: 'test' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBeDefined();
  });

  it('returns 400 when no tenant slug header', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue(null);

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ answer: 'test' }));

    expect(res.status).toBe(400);
  });

  it('returns 404 when tenant not found', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('some-slug');
    mockGetTenant.mockResolvedValue(null);

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ answer: 'test' }));

    expect(res.status).toBe(404);
  });

  it('returns 400 when answer is missing', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park', is_active: true });

    const { POST } = await import('./route');
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it('returns existing redemption code if already completed', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park', is_active: true });

    const redemptionBuilder = createQueryBuilder({ redemption_code: 'ABC123' });
    mockFrom.mockReturnValue(redemptionBuilder);

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ answer: 'test' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.correct).toBe(true);
    expect(json.redemption_code).toBe('ABC123');
  });

  it('returns { correct: false } for wrong answer', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park', is_active: true });

    // No existing redemption
    const noRedemption = createQueryBuilder(null);
    // Animals query
    const animalsBuilder: Record<string, unknown> = {};
    ['select', 'eq', 'order'].forEach((m) => {
      animalsBuilder[m] = vi.fn(() => animalsBuilder);
    });
    animalsBuilder.single = vi.fn(() => Promise.resolve({
      data: [
        { letter: 'א', order_index: 1 },
        { letter: 'ב', order_index: 2 },
      ],
      error: null,
    }));

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return noRedemption; // redemptions check
      return animalsBuilder; // animals query
    });

    // Override the animals query to return array directly
    const animalsResult = {
      data: [
        { letter: 'א', order_index: 1 },
        { letter: 'ב', order_index: 2 },
      ],
      error: null,
    };
    const animalsQ: Record<string, unknown> = {};
    ['select', 'eq'].forEach((m) => {
      animalsQ[m] = vi.fn(() => animalsQ);
    });
    animalsQ.order = vi.fn(() => Promise.resolve(animalsResult));

    callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return noRedemption;
      return animalsQ;
    });

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ answer: 'wrong' }));
    const json = await res.json();

    expect(json.correct).toBe(false);
  });

  it('returns correct=true with redemption code for correct answer', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park', is_active: true });

    const noRedemption = createQueryBuilder(null);
    const animalsResult = {
      data: [
        { letter: 'א', order_index: 1 },
        { letter: 'ב', order_index: 2 },
        { letter: 'ג', order_index: 3 },
      ],
      error: null,
    };
    const animalsQ: Record<string, unknown> = {};
    ['select', 'eq'].forEach((m) => {
      animalsQ[m] = vi.fn(() => animalsQ);
    });
    animalsQ.order = vi.fn(() => Promise.resolve(animalsResult));

    const adminInsert = createQueryBuilder({});
    const adminUpdate = createQueryBuilder({});

    let fromCall = 0;
    mockFrom.mockImplementation(() => {
      fromCall++;
      if (fromCall === 1) return noRedemption;
      return animalsQ;
    });

    let adminFromCall = 0;
    mockAdminFrom.mockImplementation(() => {
      adminFromCall++;
      if (adminFromCall === 1) return adminInsert; // redemptions insert
      return adminUpdate; // profiles update
    });

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ answer: 'אבג' }));
    const json = await res.json();

    expect(json.correct).toBe(true);
    expect(json.redemption_code).toBeDefined();
    expect(typeof json.redemption_code).toBe('string');
    expect(json.redemption_code.length).toBe(8);
  });
});
