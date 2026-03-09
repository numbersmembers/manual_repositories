# Design: Bloter/Numbers Manual Repositories v2 Refactoring

> 작성일: 2026-03-09
> Plan 참조: docs/01-plan/features/v2-refactoring.plan.md
> 상태: Draft

---

## 1. 프로젝트 구조

### 1.1 디렉토리 구조 (Next.js 15 App Router)

```
manual_repositories/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers, sidebar)
│   ├── page.tsx                  # 홈 대시보드 (활동 피드 + 북마크)
│   ├── login/
│   │   └── page.tsx              # 로그인 페이지
│   ├── pending/
│   │   └── page.tsx              # 승인 대기 페이지
│   ├── documents/
│   │   ├── page.tsx              # 문서함 (파일 탐색기)
│   │   └── [id]/
│   │       └── page.tsx          # 문서 상세 (미리보기 + 댓글)
│   ├── upload/
│   │   └── page.tsx              # 벌크 업로드
│   ├── admin/
│   │   ├── page.tsx              # 관리자 메인 (사용자 관리)
│   │   ├── logs/
│   │   │   └── page.tsx          # 활동 로그 대시보드
│   │   └── categories/
│   │       └── page.tsx          # 카테고리 관리
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts          # Supabase Auth 콜백
│   │   └── signout/
│   │       └── route.ts          # 로그아웃 처리
│   └── api/                      # API Routes (Serverless)
│       ├── documents/
│       │   ├── route.ts          # GET(목록+검색), POST(생성)
│       │   ├── [id]/
│       │   │   ├── route.ts      # GET(상세), DELETE
│       │   │   └── move/
│       │   │       └── route.ts  # PATCH (카테고리 이동)
│       │   └── search/
│       │       └── route.ts      # GET (FTS 검색)
│       ├── categories/
│       │   ├── route.ts          # GET(목록), POST(생성)
│       │   └── [id]/
│       │       └── route.ts      # PATCH(수정), DELETE
│       ├── tags/
│       │   ├── route.ts          # GET(목록+자동완성), POST(생성)
│       │   └── [id]/
│       │       └── route.ts      # DELETE
│       ├── bookmarks/
│       │   └── route.ts          # GET(내 북마크), POST(토글)
│       ├── comments/
│       │   ├── route.ts          # POST(생성)
│       │   └── [id]/
│       │       └── route.ts      # DELETE
│       ├── upload/
│       │   └── route.ts          # POST (Supabase Storage 업로드)
│       ├── users/
│       │   ├── route.ts          # GET(목록 - admin)
│       │   └── [id]/
│       │       └── route.ts      # PATCH(역할/상태 변경)
│       └── activity-logs/
│           └── route.ts          # GET(로그 조회 - admin)
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx       # D: 좌측 사이드바
│   │   ├── mobile-nav.tsx        # 모바일 하단 탭
│   │   ├── header.tsx            # 상단 헤더 (검색 트리거, 유저 메뉴)
│   │   └── breadcrumb.tsx        # 경로 표시
│   ├── documents/
│   │   ├── file-explorer.tsx     # B: 그리드/리스트 전환 파일 탐색기
│   │   ├── file-card.tsx         # 그리드 뷰 카드
│   │   ├── file-row.tsx          # 리스트 뷰 행
│   │   ├── document-preview.tsx  # 문서 미리보기 (PDF/이미지/Office)
│   │   ├── folder-tree.tsx       # 폴더 트리 (사이드바용)
│   │   └── category-badge.tsx    # 카테고리 경로 뱃지
│   ├── upload/
│   │   ├── bulk-uploader.tsx     # 벌크 업로드 드롭존
│   │   ├── upload-queue.tsx      # 업로드 대기열 테이블
│   │   └── upload-item.tsx       # 대기열 개별 항목
│   ├── search/
│   │   ├── command-search.tsx    # Cmd+K 글로벌 검색 모달
│   │   └── tag-filter.tsx        # 태그 필터 바
│   ├── admin/
│   │   ├── user-table.tsx        # 사용자 관리 테이블
│   │   ├── activity-table.tsx    # 활동 로그 테이블
│   │   └── category-manager.tsx  # 카테고리 CRUD
│   ├── dashboard/
│   │   ├── activity-feed.tsx     # 최근 활동 피드
│   │   ├── bookmarks-widget.tsx  # 북마크 위젯
│   │   └── quick-access.tsx      # 빠른 접근 (최근 폴더)
│   ├── comments/
│   │   ├── comment-list.tsx      # 댓글 목록
│   │   └── comment-form.tsx      # 댓글 입력
│   └── ui/                       # shadcn/ui 컴포넌트 (유지)
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 브라우저용 Supabase 클라이언트
│   │   ├── server.ts             # 서버용 Supabase 클라이언트 (쿠키 기반)
│   │   ├── middleware.ts         # Next.js 미들웨어용 클라이언트
│   │   └── storage.ts           # Storage 헬퍼 (업로드/다운로드/URL)
│   ├── hooks/
│   │   ├── use-auth.ts           # 인증 상태 훅
│   │   ├── use-documents.ts      # 문서 관련 쿼리 훅
│   │   ├── use-categories.ts     # 카테고리 쿼리 훅
│   │   ├── use-tags.ts           # 태그 쿼리 훅
│   │   └── use-bookmarks.ts      # 북마크 훅
│   ├── types.ts                  # 타입 정의
│   ├── utils.ts                  # 유틸리티
│   └── constants.ts              # 상수 정의
├── middleware.ts                  # Next.js 미들웨어 (인증 체크, 리다이렉트)
├── public/
│   ├── favicon.png
│   └── opengraph.jpg
├── docs/                         # PDCA 문서 (유지)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                    # 환경 변수
```

### 1.2 제거 대상 (Replit 관련)

```
삭제:
├── .replit
├── replit.md
├── server/                       # 전체 삭제 (Next.js API Routes로 대체)
│   ├── db.ts
│   ├── index.ts
│   ├── routes.ts
│   ├── seed.ts
│   ├── static.ts
│   ├── storage.ts
│   ├── storage-supabase.ts
│   ├── supabase.ts
│   ├── vite.ts
│   └── replit_integrations/      # 전체 삭제
├── client/                       # app/으로 구조 전환 후 삭제
├── shared/                       # lib/types.ts로 통합 후 삭제
├── script/build.ts               # next build로 대체
├── drizzle.config.ts             # Supabase JS Client 통일 후 불필요
├── vite.config.ts                # Next.js로 대체
├── vite-plugin-meta-images.ts
├── postcss.config.js
├── components.json               # 경로 업데이트 필요 (삭제 아님)

package.json에서 제거:
- @replit/vite-plugin-* (3개)
- connect-pg-simple
- memorystore
- express, express-session
- passport, passport-google-oauth20, passport-local
- drizzle-orm, drizzle-kit, drizzle-zod
- openid-client
- vite (next.js 내장)
- ws
- pg (Supabase JS Client로 대체)
```

---

## 2. DB 스키마 상세 설계

### 2.1 ERD

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  users   │     │  documents   │     │ categories│
├──────────┤     ├──────────────┤     ├──────────┤
│ id (PK)  │◄────│ author_id    │     │ id (PK)  │
│ email    │     │ category_id  │────►│ name     │
│ name     │     │ storage_path │     │ parent_id│──┐
│ role     │     │ ...          │     │ path     │  │
│ status   │     └──────┬───────┘     │ sort_order│ │
│ avatar_url│           │             └──────────┘  │
└─────┬────┘           │                   ▲        │
      │                │                   └────────┘
      │           ┌────┴────┐                (self-ref)
      │           │         │
      │    ┌──────┴───┐  ┌──┴──────────┐
      │    │doc_tags   │  │  comments   │
      │    ├──────────┤  ├────────────┤
      │    │doc_id(FK)│  │ doc_id(FK) │
      │    │tag_id(FK)│  │ author_id  │
      │    └──────────┘  │ content    │
      │         ▲         └────────────┘
      │    ┌────┴────┐
      │    │  tags    │
      │    ├─────────┤
      │    │ id (PK) │
      │    │ name    │
      │    └─────────┘
      │
      ├────────────────────────┐
      │                        │
┌─────┴──────┐        ┌───────┴───────┐
│ bookmarks  │        │activity_logs  │
├────────────┤        ├───────────────┤
│ user_id(FK)│        │ user_id (FK)  │
│ doc_id(FK) │        │ action        │
└────────────┘        │ target_type   │
                      │ metadata      │
                      └───────────────┘
```

### 2.2 완성 SQL

```sql
-- ============================================
-- Bloter/Numbers v2 Schema
-- Supabase SQL Editor에서 실행
-- ============================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('staff', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('active', 'banned', 'pending')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- 2. Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_path ON categories(path);

-- 3. Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_extension TEXT,
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  security_level TEXT NOT NULL DEFAULT 'general'
    CHECK (security_level IN ('general', 'confidential')),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_author ON documents(author_id);
CREATE INDEX idx_documents_security ON documents(security_level);
CREATE INDEX idx_documents_created ON documents(created_at DESC);

-- 3.1 FTS (Full-Text Search)
ALTER TABLE documents ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(file_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(author_name, '')), 'C')
  ) STORED;

CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

-- 4. Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_name ON tags(name);

-- 5. Document-Tag 관계
CREATE TABLE document_tags (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

CREATE INDEX idx_document_tags_tag ON document_tags(tag_id);

-- 6. Bookmarks
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- 7. Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_document ON comments(document_id);

-- 8. Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL
    CHECK (action IN (
      'login', 'logout',
      'upload', 'download', 'view', 'delete', 'move',
      'create_folder', 'delete_folder',
      'approve_user', 'ban_user', 'change_role'
    )),
  target_type TEXT
    CHECK (target_type IN ('document', 'category', 'user') OR target_type IS NULL),
  target_id UUID,
  target_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_target ON activity_logs(target_type, target_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 서버 사이드(service_role key)에서만 접근하므로 bypass 정책
-- Next.js API Routes에서 service_role key 사용
CREATE POLICY "Service role bypass" ON users FOR ALL
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON categories FOR ALL
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON documents FOR ALL
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON tags FOR ALL
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON document_tags FOR ALL
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON bookmarks FOR ALL
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON comments FOR ALL
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON activity_logs FOR ALL
  USING (true) WITH CHECK (true);

-- ============================================
-- FTS 검색 함수 (태그 포함)
-- ============================================

CREATE OR REPLACE FUNCTION search_documents(
  search_query TEXT,
  user_role TEXT DEFAULT 'staff',
  category_filter UUID DEFAULT NULL,
  tag_filters TEXT[] DEFAULT NULL,
  result_limit INTEGER DEFAULT 50,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  file_name TEXT,
  file_type TEXT,
  file_extension TEXT,
  storage_path TEXT,
  file_size BIGINT,
  security_level TEXT,
  category_id UUID,
  author_id UUID,
  author_name TEXT,
  created_at TIMESTAMPTZ,
  rank REAL,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id, d.title, d.file_name, d.file_type, d.file_extension,
    d.storage_path, d.file_size, d.security_level,
    d.category_id, d.author_id, d.author_name, d.created_at,
    CASE
      WHEN search_query IS NOT NULL AND search_query != ''
      THEN ts_rank(d.search_vector, plainto_tsquery('simple', search_query))
      ELSE 1.0
    END AS rank,
    COALESCE(
      ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
      '{}'::TEXT[]
    ) AS tags
  FROM documents d
  LEFT JOIN document_tags dt ON dt.document_id = d.id
  LEFT JOIN tags t ON t.id = dt.tag_id
  WHERE
    -- 보안등급 필터: staff는 general만, admin은 전체
    (user_role = 'admin' OR d.security_level = 'general')
    -- FTS 검색 (빈 검색어면 전체)
    AND (
      search_query IS NULL
      OR search_query = ''
      OR d.search_vector @@ plainto_tsquery('simple', search_query)
      -- LIKE 폴백 (한글 단어 부분 매칭)
      OR d.title ILIKE '%' || search_query || '%'
      OR d.file_name ILIKE '%' || search_query || '%'
    )
    -- 카테고리 필터
    AND (category_filter IS NULL OR d.category_id = category_filter)
  GROUP BY d.id
  HAVING
    -- 태그 필터
    tag_filters IS NULL
    OR tag_filters = '{}'::TEXT[]
    OR tag_filters <@ ARRAY_AGG(DISTINCT t.name)
  ORDER BY rank DESC, d.created_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;
```

### 2.3 데이터 마이그레이션

```sql
-- ============================================
-- v1 → v2 데이터 마이그레이션
-- 기존 테이블: users, categories, documents, comments, login_logs
-- ============================================

-- Step 1: users 마이그레이션 (등급 변환)
-- 관리자 지정: 문병선(mrmoon@numbers.co.kr), 윤보라
-- 나머지는 모두 staff
INSERT INTO users_v2 (id, email, name, role, status, avatar_url, created_at)
SELECT
  id, email, name,
  CASE
    WHEN email = 'mrmoon@numbers.co.kr' THEN 'admin'
    WHEN name = '윤보라' THEN 'admin'
    ELSE 'staff'
  END AS role,
  status,
  avatar_url,
  created_at
FROM users;

-- Step 2: categories 마이그레이션 (sort_order 추가)
INSERT INTO categories_v2 (id, name, parent_id, path, sort_order, created_at)
SELECT id, name, parent_id, path, 0, created_at
FROM categories;

-- Step 3: documents 마이그레이션
-- file_data(Base64) → Supabase Storage 업로드는 별도 스크립트 필요
-- security_level 변환: secret/important → confidential, general → general
INSERT INTO documents_v2 (
  id, title, file_name, file_type, file_extension,
  storage_path, file_size, security_level,
  category_id, author_id, author_name, created_at
)
SELECT
  id,
  title,
  COALESCE(NULLIF(url, '#'), title) AS file_name,
  type AS file_type,
  CASE type
    WHEN 'pdf' THEN '.pdf'
    WHEN 'excel' THEN '.xlsx'
    WHEN 'ms_word' THEN '.docx'
    WHEN 'hwp' THEN '.hwp'
    WHEN 'text' THEN '.txt'
    WHEN 'image' THEN '.png'
    ELSE ''
  END AS file_extension,
  'migrated/' || id AS storage_path,  -- 임시 경로, Storage 업로드 후 업데이트
  NULL AS file_size,
  CASE
    WHEN security_level IN ('secret', 'important') THEN 'confidential'
    ELSE 'general'
  END AS security_level,
  category_id, author_id, author_name, created_at
FROM documents;

-- Step 4: comments 마이그레이션 (구조 동일)
INSERT INTO comments_v2 (id, document_id, author_id, author_name, content, created_at)
SELECT id, document_id, author_id, author_name, content, created_at
FROM comments;

-- Step 5: login_logs → activity_logs 변환
INSERT INTO activity_logs (
  user_id, user_email, user_name, action,
  target_type, metadata, created_at
)
SELECT
  user_id, user_email, user_name, action,
  NULL,
  jsonb_build_object(
    'ip_address', ip_address,
    'user_agent', user_agent,
    'source', 'migrated_from_v1'
  ),
  created_at
FROM login_logs;
```

---

## 3. 인증 설계

### 3.1 Supabase Auth + Google OAuth 흐름

```
사용자 → "Google로 로그인" 클릭
  → Supabase Auth signInWithOAuth({ provider: 'google' })
  → Google 동의 화면
  → /auth/callback (Next.js Route Handler)
  → Supabase 세션 생성 (JWT, 쿠키 저장)
  → users 테이블에서 email로 조회
    → 존재 & active → 홈으로 리다이렉트
    → 존재 & pending → /pending으로 리다이렉트
    → 존재 & banned → 에러 메시지 + 로그아웃
    → 미존재 → users에 INSERT (status: 'pending') → /pending
```

### 3.2 Supabase 클라이언트 구성

```typescript
// lib/supabase/client.ts (브라우저)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts (서버 컴포넌트, API Routes)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

### 3.3 미들웨어 (인증 + 라우트 보호)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request) {
  const supabase = createServerClient(/* ... */)
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const publicPaths = ['/login', '/auth/callback']

  // 미인증 → 로그인으로
  if (!authUser && !publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 인증됨 → DB에서 사용자 조회
  if (authUser) {
    const { data: dbUser } = await supabase
      .from('users').select('*')
      .eq('email', authUser.email).single()

    // pending → /pending으로
    if (dbUser?.status === 'pending' && path !== '/pending') {
      return NextResponse.redirect(new URL('/pending', request.url))
    }
    // banned → 로그아웃
    if (dbUser?.status === 'banned') {
      return NextResponse.redirect(new URL('/auth/signout', request.url))
    }
    // admin 전용 페이지 체크
    if (path.startsWith('/admin') && dbUser?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.png|opengraph.jpg).*)']
}
```

### 3.4 관리자 초기 데이터

```
마이그레이션 시 관리자로 지정되는 계정:
- 문병선 (mrmoon@numbers.co.kr) → role: 'admin'
- 윤보라 (이메일로 매칭)             → role: 'admin'
- 나머지 모든 기존 사용자              → role: 'staff'
- 신규 가입자                         → role: 'staff', status: 'pending'
```

---

## 4. 파일 저장소 설계

### 4.1 Supabase Storage 버킷

```
버킷: documents (private)
├── {category_path}/
│   ├── {uuid}_{original_filename}
│   └── ...
```

### 4.2 업로드 흐름

```
[단일 파일]
파일 선택 → 메타데이터 입력 (카테고리, 태그, 보안등급)
→ POST /api/upload (multipart/form-data)
→ Supabase Storage 업로드
→ documents 테이블 INSERT
→ document_tags INSERT
→ activity_logs INSERT (action: 'upload')

[폴더/벌크 업로드]
폴더 드래그 or 다중 파일 선택
→ webkitdirectory API로 파일 목록 + 상대 경로 추출
→ 업로드 대기열 표시 (각 파일별 카테고리/태그/보안등급 설정)
→ [전체 설정] 버튼으로 일괄 적용 가능
→ [업로드 시작] → 순차 업로드 (progress bar)
→ 각 파일마다: Storage 업로드 → DB INSERT → 로그 기록
```

### 4.3 다운로드 흐름

```
다운로드 버튼 클릭
→ GET /api/documents/{id}?download=true
→ 권한 확인 (보안등급 vs 사용자 역할)
→ Supabase Storage createSignedUrl (60초 만료)
→ activity_logs INSERT (action: 'download')
→ signed URL 리턴 → 브라우저 다운로드
```

### 4.4 미리보기 전략

| 파일 타입 | 방법 | 구현 |
|-----------|------|------|
| PDF | `<iframe>` 또는 `react-pdf` | signed URL을 iframe src로 |
| 이미지 (jpg/png/gif/webp) | `<img>` 태그 | signed URL을 src로 |
| Office (docx/xlsx/pptx) | Microsoft Office Online Viewer | `https://view.officeapps.live.com/op/embed.aspx?src={public_url}` |
| HWP | 미지원 → 다운로드 유도 | "다운로드하여 열기" 안내 |
| 텍스트 | `<pre>` 또는 코드 뷰어 | fetch → text 표시 |
| 기타 | 다운로드 유도 | 파일 아이콘 + 다운로드 버튼 |

**Office 미리보기 제약사항:**
- MS Office Online Viewer는 **공개 접근 가능한 URL** 필요
- Supabase Storage의 signed URL은 공개 접근 가능하므로 사용 가능
- 단, signed URL 만료 시간을 미리보기 세션 동안 충분히 설정 (300초)

---

## 5. API 설계

### 5.1 엔드포인트 목록

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | /api/documents | auth | 문서 목록 (보안등급 필터 자동) |
| GET | /api/documents/search?q=&tags=&category= | auth | FTS 검색 |
| GET | /api/documents/[id] | auth | 문서 상세 + 열람 로그 |
| POST | /api/documents | auth | 문서 메타데이터 생성 |
| DELETE | /api/documents/[id] | auth(작성자)/admin | 문서 삭제 |
| PATCH | /api/documents/[id]/move | auth | 카테고리 이동 |
| POST | /api/upload | auth | 파일 업로드 (Storage) |
| GET | /api/categories | auth | 카테고리 트리 |
| POST | /api/categories | admin | 카테고리 생성 |
| PATCH | /api/categories/[id] | admin | 카테고리 수정 (이름, 순서) |
| DELETE | /api/categories/[id] | admin | 카테고리 삭제 |
| GET | /api/tags?q= | auth | 태그 목록 (자동완성) |
| POST | /api/tags | auth | 태그 생성 |
| GET | /api/bookmarks | auth | 내 북마크 |
| POST | /api/bookmarks | auth | 북마크 토글 |
| GET | /api/comments?documentId= | auth | 댓글 목록 |
| POST | /api/comments | auth | 댓글 작성 |
| DELETE | /api/comments/[id] | admin | 댓글 삭제 |
| GET | /api/users | admin | 사용자 목록 |
| PATCH | /api/users/[id] | admin | 역할/상태 변경 |
| GET | /api/activity-logs?action=&user=&from=&to= | admin | 활동 로그 |

### 5.2 공통 인증 패턴

```typescript
// API Route 공통 패턴
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: dbUser } = await supabase
    .from('users').select('*')
    .eq('email', authUser.email).single()

  return dbUser
}

// 사용 예시
export async function GET(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ... 비즈니스 로직
}
```

### 5.3 활동 로그 헬퍼

```typescript
// lib/activity-log.ts
export async function logActivity(
  supabase: SupabaseClient,
  params: {
    userId: string
    userEmail: string
    userName: string
    action: string
    targetType?: 'document' | 'category' | 'user'
    targetId?: string
    targetName?: string
    metadata?: Record<string, any>
  }
) {
  await supabase.from('activity_logs').insert({
    user_id: params.userId,
    user_email: params.userEmail,
    user_name: params.userName,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    target_name: params.targetName,
    metadata: params.metadata ?? {},
  })
}
```

---

## 6. UI 상세 설계 (B+D 하이브리드)

### 6.1 컬러 시스템

```
Primary:    #0f172a (slate-900) - 사이드바 배경, 주요 텍스트
Accent:     #2563eb (blue-600) - 활성 메뉴, 링크, 선택 상태
Surface:    #f8fafc (slate-50) - 메인 영역 배경
Card:       #ffffff - 카드, 모달 배경
Danger:     #dc2626 (red-600) - 삭제, 대외비 뱃지
Confidential: #dc2626 (red-600) - 대외비 표시
General:    #64748b (slate-500) - 일반 보안등급

다크모드:
Primary:    #f8fafc (slate-50) - 텍스트
Surface:    #0f172a (slate-900) - 배경
Card:       #1e293b (slate-800) - 카드
```

### 6.2 레이아웃 와이어프레임

#### Desktop (1024px+)

```
┌──────────────────────────────────────────────────────────────────┐
│ [사이드바 260px]  │  [헤더]                                       │
│                   │  Bloter/Numbers    🔍 Cmd+K    🔔    👤 문병선 │
│ ┌─ WORKSPACE ──┐ ├──────────────────────────────────────────────│
│ │ 📊 홈        │ │                                              │
│ │ 📁 문서함    │ │  [메인 콘텐츠 영역]                            │
│ │ ⬆️ 업로드    │ │                                              │
│ │ 🔖 북마크    │ │  페이지별 콘텐츠가 여기에 렌더링               │
│ ├─ ADMIN ──────┤ │                                              │
│ │ 👥 사용자    │ │                                              │
│ │ 📋 활동로그  │ │                                              │
│ │ ⚙️ 카테고리  │ │                                              │
│ ├─ FOLDERS ────┤ │                                              │
│ │ ▼ 경제       │ │                                              │
│ │   ▼ 산업     │ │                                              │
│ │     자동차   │ │                                              │
│ │   금융       │ │                                              │
│ │ ▼ IT         │ │                                              │
│ │   반도체     │ │                                              │
│ │ ▼ 인사총무   │ │                                              │
│ │   규정       │ │                                              │
│ ├──────────────┤ │                                              │
│ │ 👤 문병선    │ │                                              │
│ │ Admin        │ │                                              │
│ │ [로그아웃]   │ │                                              │
│ └──────────────┘ │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

#### Mobile (< 768px)

```
┌────────────────────────┐
│ ☰  Bloter/Numbers  👤  │  ← 햄버거 메뉴 (사이드바 슬라이드)
├────────────────────────┤
│                        │
│  [메인 콘텐츠]          │
│  (풀 너비)              │
│                        │
│                        │
│                        │
├────────────────────────┤
│ 📊  📁  ⬆️  🔖  ⚙️    │  ← 하단 탭 네비게이션
└────────────────────────┘
```

### 6.3 페이지별 상세

#### 홈 대시보드 (`/`)

```
┌──────────────────────────────────────────────┐
│ 👋 안녕하세요, 문병선님                        │
│ Admin · 접근 가능 문서 42개                    │
├──────────────┬───────────────────────────────┤
│ 최근 활동     │  ⭐ 내 북마크                  │
│              │                               │
│ 김스탭 업로드  │  📄 2026 경영 목표             │
│ "마케팅 기획"  │  📄 복리후생 규정집             │
│ 2분 전       │  📄 보안 가이드                 │
│              │                               │
│ 이일반 다운로드│  ─────────────────────        │
│ "규정집 v3"   │  📁 빠른 접근                  │
│ 1시간 전     │  경제 (15) IT (8) 인사총무 (12)│
│              │                               │
│ 문병선 폴더생성│                               │
│ "IT/반도체"   │  ─────────────────────        │
│ 3시간 전     │  🏷️ 인기 태그                  │
│              │  #보고서 #규정 #매뉴얼 #기획     │
└──────────────┴───────────────────────────────┘
```

#### 문서함 (`/documents`) - B 스타일 파일 탐색기

```
┌──────────────────────────────────────────────────────────────┐
│ 📁 경제 > 산업                    [그리드] [리스트]  정렬▾   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [그리드 뷰 시]                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │  📁       │ │  PDF     │ │  XLS     │ │  DOCS    │        │
│ │           │ │  ████    │ │  ████    │ │  ████    │        │
│ │  자동차    │ │  ████    │ │  ████    │ │  ████    │        │
│ │  3 files  │ │          │ │          │ │          │        │
│ │           │ │ 경영목표  │ │ 시장분석  │ │ 동향보고 │        │
│ │           │ │ 🔒 대외비 │ │ 일반     │ │ 일반    │        │
│ │           │ │ 2.4MB    │ │ 4.5MB   │ │ -       │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
│ [리스트 뷰 시]                                               │
│ ────────────────────────────────────────────────────────     │
│ 📁 자동차                              3 files               │
│ 📄 2026년 경영 목표    대외비  PDF   2.4MB  문병선  1/15      │
│ 📊 전기차 시장 분석    일반    XLS   4.5MB  김스탭  2/01      │
│ 📝 1분기 산업 동향     일반    DOCS  -      김스탭  1/20      │
│ ────────────────────────────────────────────────────────     │
│                                                              │
│ 🏷️ #보고서(12)  #규정(5)  #매뉴얼(8)  #기획(3)              │
└──────────────────────────────────────────────────────────────┘
```

#### 벌크 업로드 (`/upload`)

```
┌──────────────────────────────────────────────────────────────┐
│ ⬆️ 파일 업로드                                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │   📁 폴더를 드래그하거나 클릭하여 선택               │   │
│  │   폴더 전체 또는 다중 파일 선택 가능                  │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ 전체 설정 ──────────────────────────────────────────┐   │
│  │ 카테고리: [경제 ▾]  보안등급: [일반 ▾]  태그: [+추가] │   │
│  │                                    [전체 적용]        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ 업로드 대기열 (5개 파일) ──────────────────────────────┐ │
│  │ ☑ 보고서_v3.pdf    [경제/산업 ▾] [일반 ▾] [#보고서 ×]  │ │
│  │ ☑ 기획안.docx      [경제/금융 ▾] [일반 ▾] [#기획 ×]    │ │
│  │ ☑ 인사규정.hwp     [인사총무 ▾]  [대외비▾] [#규정 ×]    │ │
│  │ ☑ 사진.jpg         [IT ▾]       [일반 ▾] [태그 없음]   │ │
│  │ ☑ 분석표.xlsx      [경제/산업 ▾] [일반 ▾] [#분석 ×]    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  [전체 선택] [선택 삭제]              [업로드 시작 → ] (5개) │
└──────────────────────────────────────────────────────────────┘
```

#### Cmd+K 검색 모달

```
┌──────────────────────────────────────────┐
│ 🔍 문서 검색...                           │
├──────────────────────────────────────────┤
│                                          │
│ 최근 검색                                │
│   마케팅 기획    규정집    보고서          │
│                                          │
│ 인기 태그                                │
│   #보고서  #규정  #매뉴얼  #기획          │
│                                          │
│ ─────────────────────────────            │
│ 검색어 입력 시 실시간 결과:              │
│                                          │
│ 📄 2026 마케팅 기획안  경제/산업  일반    │
│ 📄 Q1 마케팅 실적     경제/금융  일반    │
│ 📁 마케팅 (폴더)                         │
│                                          │
│ Tip: 여러 단어로 검색하면 더 정확해요    │
└──────────────────────────────────────────┘
```

#### 문서 상세 (`/documents/[id]`)

```
┌──────────────────────────────────────────────────────────────┐
│ ← 문서 목록    경제 > 산업                      ⭐ 🖨️ 📤 ⬇️  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ 문서 정보 ──────────────────────────────────────────────┐ │
│ │  [PDF]  2026년도 전사 경영 목표                  🔒대외비 │ │
│ │         작성자: 문병선  |  등록: 2026.01.15  |  2.4MB   │ │
│ │         태그: #보고서 #경영 #2026                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ 미리보기 ───────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │  ┌──────────────────────────────────────┐               │ │
│ │  │                                      │               │ │
│ │  │         PDF / 이미지 / Office        │               │ │
│ │  │         인라인 미리보기              │               │ │
│ │  │                                      │               │ │
│ │  │                                      │               │ │
│ │  └──────────────────────────────────────┘               │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ 💬 댓글 (3) ───────────────────────────────────────────┐ │
│ │  [댓글 입력...]                              [등록]      │ │
│ │                                                          │ │
│ │  문병선 · 2시간 전                                       │ │
│ │  이 문서 최신 버전으로 업데이트 필요합니다.               │ │
│ │                                                          │ │
│ │  김스탭 · 1일 전                                         │ │
│ │  확인했습니다.                                            │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. 환경 변수

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 서버 전용, NEXT_PUBLIC_ 없음

# Vercel 배포 시 동일하게 설정
```

---

## 8. 구현 순서 (실행 우선순위)

```
Phase 1: 프로젝트 구조 전환 + Replit 제거
  ↓
Phase 2: Supabase 스키마 + Auth 설정
  ↓
Phase 3: 핵심 API (인증, 문서, 카테고리, 태그, 검색)
  ↓
Phase 4: Storage 연동 (업로드/다운로드/미리보기)
  ↓
Phase 5: UI - 레이아웃 + 사이드바 + 홈
  ↓
Phase 6: UI - 문서함 (탐색기 + 검색)
  ↓
Phase 7: UI - 업로드 (벌크 + 대기열)
  ↓
Phase 8: UI - 문서 상세 (미리보기 + 댓글)
  ↓
Phase 9: UI - 관리자 (사용자 + 로그 + 카테고리)
  ↓
Phase 10: Vercel 배포 + 도메인 연결 + 데이터 마이그레이션
```

---

## 9. 핵심 의존성 (package.json)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.91.0",
    "@supabase/ssr": "^0.5.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0",
    "lucide-react": "^0.545.0",
    "cmdk": "^1.1.0",
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^8.0.0",
    "date-fns": "^3.6.0",
    "zod": "^3.25.0",
    "sonner": "^2.0.0",
    "framer-motion": "^12.0.0",
    "next-themes": "^0.4.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

**제거 목록 (현재 package.json에서):**
- `@replit/*` (3개)
- `express`, `express-session`
- `passport`, `passport-google-oauth20`, `passport-local`
- `connect-pg-simple`, `memorystore`
- `drizzle-orm`, `drizzle-kit`, `drizzle-zod`
- `openid-client`
- `pg`
- `ws`
- `vite`, `@vitejs/plugin-react`
- `@types/express*`, `@types/passport*`, `@types/connect-pg-simple`, `@types/ws`
- 사용하지 않는 radix-ui 컴포넌트들 (실제 사용분만 유지)
