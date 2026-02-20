export type UserRole = 'visitor' | 'staff' | 'admin'
export type CompletionStatus = 'in_progress' | 'completed'
export type TenantRole = 'super_admin' | 'admin' | 'staff' | 'visitor'

export interface TenantBranding {
  primary: string
  accent: string
  background: string
  text: string
  error: string
  success: string
  logo_url: string | null
  bg_image_url: string | null
  font_family: string | null
}

export interface Tenant {
  id: string
  name: string
  slug: string
  contact_email: string | null
  is_active: boolean
  branding: TenantBranding
  created_at: string
  updated_at: string
}

export interface TenantMembership {
  user_id: string
  tenant_id: string
  role: 'admin' | 'staff'
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  tenant_id: string
  full_name: string
  phone: string
  email: string
  role: UserRole
  completion_status: CompletionStatus
  completed_at: string | null
  is_super_admin: boolean
  created_at: string
}

export interface Animal {
  id: string
  tenant_id: string
  name: string
  name_he: string
  qr_token: string
  letter: string
  order_index: number
  fun_facts: string
  image_url: string | null
  video_url: string | null
  is_active: boolean
  habitat: string
  conservation_tip: string
  illustration_key: string
  created_at: string
  updated_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  tenant_id: string
  animal_id: string
  letter: string
  scanned_at: string
}

export interface Redemption {
  id: string
  user_id: string
  tenant_id: string
  redemption_code: string
  redeemed: boolean
  redeemed_at: string | null
  created_at: string
}

export interface SiteContent {
  id: string
  tenant_id: string
  content_key: string
  content_value: string
  description: string
  updated_at: string
}
