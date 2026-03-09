export const SECURITY_LEVELS = {
  GENERAL: 'general',
  CONFIDENTIAL: 'confidential',
} as const

export const USER_ROLES = {
  STAFF: 'staff',
  ADMIN: 'admin',
} as const

export const SECURITY_LEVEL_LABELS: Record<string, string> = {
  general: '일반',
  confidential: '대외비',
}

export const ROLE_LABELS: Record<string, string> = {
  staff: 'Staff',
  admin: 'Admin',
}

export const STATUS_LABELS: Record<string, string> = {
  active: '정상',
  banned: '차단됨',
  pending: '승인 대기',
}

export const STORAGE_BUCKET = 'documents'
