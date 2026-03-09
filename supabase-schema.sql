-- ============================================
-- Bloter/Numbers Manual Repositories v2 Schema
-- v1 → v2 마이그레이션 (기존 테이블 드롭 후 재생성)
-- Supabase SQL Editor에서 실행
-- ============================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 기존 v1 테이블 드롭 (의존 순서 역순)
-- ============================================
DROP TABLE IF EXISTS login_logs CASCADE;
DROP TABLE IF EXISTS document_tags CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 기존 함수 드롭
DROP FUNCTION IF EXISTS search_documents CASCADE;

-- ============================================
-- v2 테이블 생성
-- ============================================

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- FTS (Full-Text Search)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(file_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(author_name, '')), 'C')
  ) STORED
);

CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_author ON documents(author_id);
CREATE INDEX idx_documents_security ON documents(security_level);
CREATE INDEX idx_documents_created ON documents(created_at DESC);
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

-- Service role bypass 정책 (API Routes에서 service_role key 사용)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users', 'categories', 'documents', 'tags',
    'document_tags', 'bookmarks', 'comments', 'activity_logs'
  ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "Allow all for service role" ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

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
    (user_role = 'admin' OR d.security_level = 'general')
    AND (
      search_query IS NULL
      OR search_query = ''
      OR d.search_vector @@ plainto_tsquery('simple', search_query)
      OR d.title ILIKE '%' || search_query || '%'
      OR d.file_name ILIKE '%' || search_query || '%'
    )
    AND (category_filter IS NULL OR d.category_id = category_filter)
  GROUP BY d.id
  HAVING
    tag_filters IS NULL
    OR tag_filters = '{}'::TEXT[]
    OR tag_filters <@ ARRAY_AGG(DISTINCT t.name)
  ORDER BY rank DESC, d.created_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Supabase Storage 버킷 생성 (SQL로는 불가, Dashboard에서 설정)
-- 버킷명: documents (private)
-- ============================================

-- ============================================
-- 초기 관리자 데이터 (첫 로그인 후 실행)
-- 문병선, 윤보라 → admin, 나머지 → staff
-- ============================================
-- UPDATE users SET role = 'admin', status = 'active' WHERE email = 'mrmoon@numbers.co.kr';
-- UPDATE users SET role = 'admin', status = 'active' WHERE name = '윤보라';
-- UPDATE users SET status = 'active' WHERE status = 'pending' AND role = 'staff';
