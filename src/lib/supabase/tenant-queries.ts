import { SupabaseClient } from '@supabase/supabase-js'
import type { Animal, Profile, UserProgress, Redemption, SiteContent } from '@/types/database'

/**
 * Tenant-scoped query helpers.
 * Primary isolation: explicit .eq('tenant_id', tenantId) on every query.
 * Secondary isolation: RLS policies as safety net.
 */

export async function getAnimals(supabase: SupabaseClient, tenantId: string) {
  const { data, error } = await supabase
    .from('animals')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('order_index')
  if (error) throw error
  return data as Animal[]
}

export async function getProfile(supabase: SupabaseClient, userId: string, tenantId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data as Profile | null
}

export async function getProgress(supabase: SupabaseClient, userId: string, tenantId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
  if (error) throw error
  return data as UserProgress[]
}

export async function getRedemption(supabase: SupabaseClient, userId: string, tenantId: string) {
  const { data, error } = await supabase
    .from('redemptions')
    .select('*')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data as Redemption | null
}

export async function getSiteContent(supabase: SupabaseClient, tenantId: string) {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('tenant_id', tenantId)
  if (error) throw error
  return data as SiteContent[]
}

export async function getSiteContentByKey(supabase: SupabaseClient, tenantId: string, key: string) {
  const { data, error } = await supabase
    .from('site_content')
    .select('content_value')
    .eq('tenant_id', tenantId)
    .eq('content_key', key)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data?.content_value ?? null
}
