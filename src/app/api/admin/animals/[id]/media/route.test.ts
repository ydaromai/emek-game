import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

// Mock admin client
const mockAdminFrom = vi.fn();
const mockAdminStorage = {
  from: vi.fn(() => ({
    remove: vi.fn(() => Promise.resolve({})),
    upload: vi.fn(() => Promise.resolve({ error: null })),
    getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://storage.test/image.jpg' } })),
  })),
};
const mockAdminClient = {
  from: mockAdminFrom,
  storage: mockAdminStorage,
};
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

// Mock tenant
const mockGetTenant = vi.fn();
vi.mock('@/lib/tenant', () => ({
  getTenant: (...args: unknown[]) => mockGetTenant(...args),
}));

function createMembershipBuilder(data: unknown) {
  const builder: Record<string, unknown> = {};
  ['select', 'eq'].forEach((m) => {
    builder[m] = vi.fn(() => builder);
  });
  builder.single = vi.fn(() => Promise.resolve({ data, error: null }));
  return builder;
}

function createAnimalBuilder(data: unknown) {
  const builder: Record<string, unknown> = {};
  ['select', 'eq'].forEach((m) => {
    builder[m] = vi.fn(() => builder);
  });
  builder.single = vi.fn(() => Promise.resolve({ data, error: null }));
  return builder;
}

const paramsPromise = Promise.resolve({ id: 'animal-1' });

describe('POST /api/admin/animals/[id]/media', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { POST } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/animals/animal-1/media', {
      method: 'POST',
    });
    const res = await POST(req, { params: paramsPromise });

    expect(res.status).toBe(401);
  });

  it('returns 400 when no tenant context', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue(null);
    mockGetTenant.mockResolvedValue(null);

    const { POST } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/animals/animal-1/media', {
      method: 'POST',
    });
    const res = await POST(req, { params: paramsPromise });

    expect(res.status).toBe(400);
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park' });

    const membershipBuilder = createMembershipBuilder({ role: 'visitor' });
    mockFrom.mockReturnValue(membershipBuilder);

    const { POST } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/animals/animal-1/media', {
      method: 'POST',
    });
    const res = await POST(req, { params: paramsPromise });

    expect(res.status).toBe(403);
  });

  it('returns 404 when animal not in tenant', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park' });

    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) return createMembershipBuilder({ role: 'admin' });
      return createAnimalBuilder(null); // animal not found
    });

    const { POST } = await import('./route');
    const formData = new FormData();
    formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }));
    formData.append('type', 'image');

    const req = new NextRequest('http://localhost/api/admin/animals/animal-1/media', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req, { params: paramsPromise });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/admin/animals/[id]/media', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { DELETE } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/animals/animal-1/media', {
      method: 'DELETE',
      body: JSON.stringify({ type: 'image' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await DELETE(req, { params: paramsPromise });

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid type', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park' });

    const membershipBuilder = createMembershipBuilder({ role: 'admin' });
    mockFrom.mockReturnValue(membershipBuilder);

    const { DELETE } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/animals/animal-1/media', {
      method: 'DELETE',
      body: JSON.stringify({ type: 'audio' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await DELETE(req, { params: paramsPromise });

    expect(res.status).toBe(400);
  });

  it('returns success when deleting media', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    });
    mockHeadersGet.mockReturnValue('park-slug');
    mockGetTenant.mockResolvedValue({ id: 't1', name: 'Park' });

    let callNum = 0;
    mockFrom.mockImplementation(() => {
      callNum++;
      if (callNum === 1) return createMembershipBuilder({ role: 'admin' });
      return createAnimalBuilder({ image_url: 'https://storage/old.jpg', video_url: null });
    });

    const updateBuilder: Record<string, unknown> = {};
    ['update', 'eq'].forEach((m) => {
      updateBuilder[m] = vi.fn(() => updateBuilder);
    });
    mockAdminFrom.mockReturnValue(updateBuilder);

    const { DELETE } = await import('./route');
    const req = new NextRequest('http://localhost/api/admin/animals/animal-1/media', {
      method: 'DELETE',
      body: JSON.stringify({ type: 'image' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await DELETE(req, { params: paramsPromise });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
