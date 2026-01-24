import { Category, Document, User, USER_LEVELS } from './types';

// Initial Mock Data
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'mrmoon@numbers.co.kr',
    name: '문병선',
    level: 3,
    isAdmin: true,
    status: 'active',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moon'
  },
  {
    id: 'u2',
    email: 'staff@numbers.co.kr',
    name: '김스탭',
    level: 2,
    isAdmin: false,
    status: 'active',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Staff'
  },
  {
    id: 'u3',
    email: 'user@numbers.co.kr',
    name: '이일반',
    level: 1,
    isAdmin: false,
    status: 'active',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
  }
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: '경제', parentId: null, path: '경제' },
  { id: 'c2', name: '산업', parentId: 'c1', path: '경제/산업' },
  { id: 'c3', name: '자동차', parentId: 'c2', path: '경제/산업/자동차' },
  { id: 'c4', name: 'IT', parentId: null, path: 'IT' },
  { id: 'c5', name: '반도체', parentId: 'c4', path: 'IT/반도체' },
  { id: 'c6', name: '인사/총무', parentId: null, path: '인사/총무' },
  { id: 'c7', name: '규정', parentId: 'c6', path: '인사/총무/규정' },
];

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'd1',
    title: '2026년도 전사 경영 목표 (대외비)',
    type: 'pdf',
    securityLevel: 'secret',
    categoryId: 'c1',
    url: '#',
    createdAt: '2026-01-15T09:00:00Z',
    authorId: 'u1',
    authorName: '문병선',
    size: '2.4 MB'
  },
  {
    id: 'd2',
    title: '1분기 산업 동향 보고서',
    type: 'google_docs',
    securityLevel: 'important',
    categoryId: 'c2',
    url: '#',
    createdAt: '2026-01-20T14:30:00Z',
    authorId: 'u2',
    authorName: '김스탭',
    size: 'N/A'
  },
  {
    id: 'd3',
    title: '신규 전기차 시장 분석',
    type: 'excel',
    securityLevel: 'important',
    categoryId: 'c3',
    url: '#',
    createdAt: '2026-01-22T11:00:00Z',
    authorId: 'u2',
    authorName: '김스탭',
    size: '4.5 MB'
  },
  {
    id: 'd4',
    title: '사내 와이파이 접속 가이드',
    type: 'text',
    securityLevel: 'general',
    categoryId: 'c6',
    url: '#',
    createdAt: '2025-12-10T10:00:00Z',
    authorId: 'u1',
    authorName: '문병선',
    size: '12 KB'
  },
  {
    id: 'd5',
    title: '복리후생 규정집 v3.0',
    type: 'hwp',
    securityLevel: 'general',
    categoryId: 'c7',
    url: '#',
    createdAt: '2025-11-05T09:00:00Z',
    authorId: 'u1',
    authorName: '문병선',
    size: '1.2 MB'
  }
];

// Helper to build tree
export function buildCategoryTree(categories: Category[]) {
  const map = new Map<string, Category & { children: Category[] }>();
  const roots: (Category & { children: Category[] })[] = [];

  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}
