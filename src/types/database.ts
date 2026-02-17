export type UserRole = 'visitor' | 'staff' | 'admin'
export type CompletionStatus = 'in_progress' | 'completed'

export interface Profile {
  id: string
  full_name: string
  phone: string
  email: string
  role: UserRole
  completion_status: CompletionStatus
  completed_at: string | null
  created_at: string
}

export interface Animal {
  id: string
  name: string
  name_he: string
  qr_token: string
  letter: string
  order_index: number
  fun_facts: string
  image_url: string | null
  video_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  animal_id: string
  letter: string
  scanned_at: string
}

export interface Redemption {
  id: string
  user_id: string
  redemption_code: string
  redeemed: boolean
  redeemed_at: string | null
  created_at: string
}
