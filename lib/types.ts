export type UserRole = 'staff' | 'admin'
export type UserStatus = 'active' | 'banned' | 'pending'
export type SecurityLevel = 'general' | 'confidential'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  avatar_url: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  parent_id: string | null
  path: string
  sort_order: number
  created_at: string
  children?: Category[]
}

export interface Document {
  id: string
  title: string
  file_name: string
  file_type: string
  file_extension: string | null
  storage_path: string
  file_size: number | null
  security_level: SecurityLevel
  category_id: string
  author_id: string
  author_name: string
  created_at: string
  tags?: string[]
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  document_id: string
  created_at: string
}

export interface Comment {
  id: string
  document_id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
}

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'upload'
  | 'download'
  | 'view'
  | 'delete'
  | 'move'
  | 'create_folder'
  | 'delete_folder'
  | 'approve_user'
  | 'ban_user'
  | 'change_role'
  | 'change_security'

export interface ActivityLog {
  id: string
  user_id: string | null
  user_email: string
  user_name: string
  action: ActivityAction
  target_type: 'document' | 'category' | 'user' | null
  target_id: string | null
  target_name: string | null
  metadata: Record<string, unknown>
  created_at: string
}
