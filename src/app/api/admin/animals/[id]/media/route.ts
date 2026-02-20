import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenant } from '@/lib/tenant';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

async function resolveTenantFromHeaders() {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  if (!slug) return null;
  return getTenant(slug);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve tenant
  const tenant = await resolveTenantFromHeaders();
  if (!tenant) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
  }
  const tenantId = tenant.id;

  // Verify admin membership for this tenant
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single();

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Verify animal belongs to this tenant
  const { data: animal } = await supabase
    .from('animals')
    .select('image_url, video_url, tenant_id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (!animal) {
    return NextResponse.json({ error: 'Animal not found in this tenant' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const type = formData.get('type') as string; // 'image' or 'video'

  if (!file || !type) {
    return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
  }

  // MIME type and extension validation
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
  const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const ALLOWED_VIDEO_EXTS = ['mp4', 'webm'];

  const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
  const allowedExts = type === 'image' ? ALLOWED_IMAGE_EXTS : ALLOWED_VIDEO_EXTS;

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !allowedExts.includes(ext)) {
    return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 });
  }

  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File too large (max ${maxSize / 1024 / 1024}MB)` }, { status: 400 });
  }

  const bucket = type === 'image' ? 'animal-images' : 'animal-videos';
  const path = `${tenantId}/${id}/${Date.now()}.${ext}`;

  const adminClient = createAdminClient();

  // Delete old file if exists
  const oldUrl = type === 'image' ? animal.image_url : animal.video_url;
  if (oldUrl) {
    const oldPath = oldUrl.split(`${bucket}/`).pop();
    if (oldPath) {
      await adminClient.storage.from(bucket).remove([oldPath]);
    }
  }

  // Upload new file
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await adminClient.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data: { publicUrl } } = adminClient.storage.from(bucket).getPublicUrl(path);

  // Update animal record
  const updateField = type === 'image' ? 'image_url' : 'video_url';
  await adminClient.from('animals').update({ [updateField]: publicUrl }).eq('id', id).eq('tenant_id', tenantId);

  return NextResponse.json({ url: publicUrl });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve tenant
  const tenant = await resolveTenantFromHeaders();
  if (!tenant) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
  }
  const tenantId = tenant.id;

  // Verify admin membership for this tenant
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single();

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { type } = await request.json();

  if (type !== 'image' && type !== 'video') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const bucket = type === 'image' ? 'animal-images' : 'animal-videos';
  const urlField = type === 'image' ? 'image_url' : 'video_url';

  // Verify animal belongs to this tenant
  const { data: animal } = await supabase
    .from('animals')
    .select('image_url, video_url')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (animal) {
    const oldUrl = animal[urlField];
    if (oldUrl) {
      const oldPath = oldUrl.split(`${bucket}/`).pop();
      if (oldPath) {
        const adminClient = createAdminClient();
        await adminClient.storage.from(bucket).remove([oldPath]);
      }
    }
  }

  const adminClient = createAdminClient();
  await adminClient.from('animals').update({ [urlField]: null }).eq('id', id).eq('tenant_id', tenantId);

  return NextResponse.json({ success: true });
}
