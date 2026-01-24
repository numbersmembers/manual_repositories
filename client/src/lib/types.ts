export type UserLevel = 1 | 2 | 3;
// Level 3: Admin (Secret, Important, General)
// Level 2: Staff (Important, General)
// Level 1: General (General)

export type DocumentType = 
  | 'google_docs' 
  | 'ms_word' 
  | 'hwp' 
  | 'text' 
  | 'image' 
  | 'excel' 
  | 'pdf';

export type SecurityLevel = 'secret' | 'important' | 'general';

export interface User {
  id: string;
  email: string;
  name: string;
  level: UserLevel;
  avatarUrl?: string;
  isAdmin?: boolean;
  status: 'active' | 'banned';
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  path: string; // e.g., "Economic/Industry/Automotive"
  children?: Category[];
}

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  securityLevel: SecurityLevel;
  categoryId: string;
  url: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  size?: string;
}

export const USER_LEVELS = {
  ADMIN: 3,
  STAFF: 2,
  GENERAL: 1
} as const;

export const SECURITY_LEVELS = {
  SECRET: 'secret',
  IMPORTANT: 'important',
  GENERAL: 'general'
} as const;
