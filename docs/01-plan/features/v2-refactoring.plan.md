# Plan: Bloter/Numbers Manual Repositories v2 Refactoring

> 작성일: 2026-03-09
> 상태: Draft
> 레벨: Dynamic (Fullstack)

---

## 1. 배경 및 목적

### 현재 상태
- Replit에서 개발/배포된 사내 문서 저장소 시스템
- Express 5 + React 19 + Supabase + Google OAuth
- 파일을 Base64로 DB에 저장하는 구조 (비효율적)
- 단일 파일 업로드만 지원
- 검색 기능 미흡 (제목/작성자 클라이언트 필터링만)
- UI가 프로토타입 수준

### 목표
Replit 종속성 제거 + Vercel/Supabase 기반으로 이전하면서, 실제 사내 사용에 적합한 문서 관리 시스템으로 리팩토링

---

## 2. 핵심 요구사항

### 2.1 파일 저장소
| 항목 | 현재 | 목표 |
|------|------|------|
| 저장 방식 | Base64 → DB text 컬럼 | Supabase Storage (S3 호환) |
| 업로드 | 단일 파일만 | 폴더 단위 + 다중 파일 벌크 업로드 |
| 파일 타입 | 제한적 | 모든 파일 타입 지원 |
| 크기 제한 | 50MB (JSON body limit) | Supabase Storage 기본 50MB, 설정 시 더 확장 |
| 미리보기 | 미지원 | PDF/이미지 인라인 + Office 문서 미리보기 |

### 2.2 사용자 및 권한
| 항목 | 현재 | 목표 |
|------|------|------|
| 등급 | 3단계 (General/Staff/Admin) | 2단계 (Staff/Admin) |
| 보안등급 | 3단계 (secret/important/general) | 2단계 (일반/대외비) |
| 접근제어 | 보안등급 기반 | 보안등급 2단계 (Staff=일반, Admin=전체) |
| 가입 방식 | Google OAuth → pending → 관리자 승인 | 유지 + 이메일 화이트리스트 옵션 추가 |

### 2.3 검색
| 항목 | 현재 | 목표 |
|------|------|------|
| 방식 | 클라이언트 title/author 필터 | PostgreSQL Full-Text Search |
| 태그 | 없음 | 태그 시스템 (업로드 시 태그 입력, 자동완성) |
| UI | 작은 검색바 | Cmd+K 글로벌 검색 모달 |

### 2.4 활동 로그
| 항목 | 현재 | 목표 |
|------|------|------|
| 범위 | 로그인/로그아웃만 | 모든 활동 (login, logout, upload, download, view, delete, move) |
| 저장 | login_logs 테이블 | activity_logs 통합 테이블 |
| 조회 | 관리자 단순 리스트 | 필터링 가능한 활동 대시보드 |

### 2.5 UI/UX (B+D 하이브리드)
| 영역 | 설계 |
|------|------|
| 레이아웃 | D: 좌측 사이드바 (워크스페이스 + 폴더트리 + 관리메뉴) |
| 메인 영역 | B: 그리드/리스트 전환 가능한 파일 탐색기 |
| 검색 | C: Cmd+K 글로벌 검색 모달 |
| 홈 | D: 활동 피드 + 북마크 + 빠른접근 |
| 업로드 | 벌크 업로드 대기열 (카테고리/태그/보안등급 일괄/개별 설정) |
| 문서 상세 | 인라인 미리보기 + 다운로드 + 댓글 |
| 반응형 | 모바일 대응 (하단 탭 네비게이션) |

### 2.6 배포
| 항목 | 현재 | 목표 |
|------|------|------|
| 서버 | Replit (Express SSR) | Vercel (Edge/Serverless) |
| DB | Supabase PostgreSQL | Supabase PostgreSQL (유지) |
| 파일 | DB 저장 | Supabase Storage |
| 도메인 | fileup.numbers.ai.kr | 유지 |

---

## 3. 기술 스택 변경

### 유지
- React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- Supabase (PostgreSQL + Auth용 아님, 데이터 저장)
- Google OAuth 2.0
- Drizzle ORM (또는 Supabase JS Client 통일)
- Zod validation

### 제거
- Replit 관련: `@replit/vite-plugin-*`, `.replit`, `replit.md`
- `server/replit_integrations/` 디렉토리
- Express 서버 (Vercel serverless로 대체)
- `connect-pg-simple` (세션 저장 방식 변경)
- `memorystore`

### 추가
- **Next.js 15 App Router** (Vercel 배포 최적화, SSR/SSG)
- **Supabase Storage** (파일 저장)
- **Supabase Auth** (Google OAuth 통합 - Passport.js 대체)
- **react-dnd** 또는 **dnd-kit** (드래그앤드롭 파일 이동)
- **cmdk** (Cmd+K 검색 모달 - 이미 설치됨)
- **Office 미리보기**: Microsoft Office Online Viewer 또는 Google Docs Viewer

### 검토 필요
- ORM 통일: 현재 Drizzle + Supabase JS가 혼재 → **Supabase JS Client로 통일** (Supabase 에코시스템에 맞춤)
- 세션 관리: Express session → **Supabase Auth 세션** (JWT 기반)

---

## 4. DB 스키마 변경

### 변경되는 테이블

```sql
-- users: 등급 단순화
users (
  id UUID PK,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',    -- 'staff' | 'admin' (기존 3단계 → 2단계)
  status TEXT NOT NULL DEFAULT 'pending', -- 'active' | 'banned' | 'pending'
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- documents: file_data 제거, 태그 추가
documents (
  id UUID PK,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,              -- 원본 파일명
  file_type TEXT NOT NULL,              -- MIME type
  file_extension TEXT,                  -- .pdf, .xlsx 등
  storage_path TEXT NOT NULL,           -- Supabase Storage 경로
  file_size BIGINT,                     -- 바이트 단위
  security_level TEXT DEFAULT 'general', -- 'general' | 'confidential' (2단계)
  category_id UUID REFERENCES categories(id),
  author_id UUID REFERENCES users(id),
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- 신규: 태그 시스템
tags (
  id UUID PK,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

document_tags (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
)

-- 신규: 북마크
bookmarks (
  id UUID PK,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, document_id)
)

-- activity_logs: login_logs 대체, 모든 활동 통합
activity_logs (
  id UUID PK,
  user_id UUID REFERENCES users(id),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,                 -- 'login','logout','upload','download','view','delete','move','create_folder'
  target_type TEXT,                     -- 'document','category','user'
  target_id UUID,
  target_name TEXT,                     -- 문서명, 폴더명 등 (조회 편의)
  metadata JSONB,                       -- 추가 정보 (IP, UserAgent, 이전 카테고리 등)
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- categories: 유지 (변경 없음)
-- comments: 유지 (변경 없음)
-- sessions: 제거 (Supabase Auth로 대체)
```

### FTS 인덱스
```sql
-- 문서 검색용 Full-Text Search
ALTER TABLE documents ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(file_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(author_name, '')), 'C')
  ) STORED;

CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);

-- 태그도 검색에 포함 (조인 쿼리 또는 materialized view)
```

---

## 5. 구현 순서 (Phase)

### Phase 1: 프로젝트 구조 전환
- [ ] Next.js 15 App Router 프로젝트 구조로 전환
- [ ] Replit 관련 파일/의존성 제거
- [ ] Supabase Auth 설정 (Google OAuth)
- [ ] 환경 변수 정리 (.env.local)

### Phase 2: DB 스키마 마이그레이션
- [ ] 새 스키마 SQL 작성 및 Supabase에 적용
- [ ] 기존 데이터 마이그레이션 (users 등급 변환, file_data → Storage)
- [ ] RLS 정책 설정 (현재 USING(true) → 역할 기반 제한)
- [ ] FTS 인덱스 생성

### Phase 3: 인증 시스템
- [ ] Supabase Auth + Google OAuth 연동
- [ ] 세션 관리 (JWT, 쿠키)
- [ ] 미들웨어: 인증 확인, 역할 확인
- [ ] 이메일 화이트리스트 + pending 승인 플로우

### Phase 4: 파일 저장소
- [ ] Supabase Storage 버킷 설정
- [ ] 파일 업로드 API (단일 + 벌크 + 폴더)
- [ ] 파일 다운로드 API (signed URL)
- [ ] 파일 미리보기 URL 생성
- [ ] 파일 이동/삭제 API

### Phase 5: 핵심 API
- [ ] 카테고리 CRUD (트리 구조)
- [ ] 문서 CRUD (메타데이터)
- [ ] 태그 CRUD + 자동완성
- [ ] 북마크 토글
- [ ] 댓글 CRUD
- [ ] 활동 로그 기록 미들웨어
- [ ] FTS 검색 API

### Phase 6: UI - 레이아웃 & 인증
- [ ] B+D 하이브리드 레이아웃 (사이드바 + 메인 영역)
- [ ] 로그인 페이지 (Google OAuth)
- [ ] Pending 승인 대기 페이지
- [ ] 반응형 모바일 레이아웃

### Phase 7: UI - 파일 탐색 & 검색
- [ ] 폴더 트리 컴포넌트 (사이드바)
- [ ] 파일 리스트/그리드 뷰 전환
- [ ] Cmd+K 글로벌 검색 모달
- [ ] 태그 필터링
- [ ] 북마크 / 빠른 접근

### Phase 8: UI - 업로드 & 관리
- [ ] 벌크 업로드 (폴더 + 다중 파일)
- [ ] 업로드 대기열 (카테고리/태그/보안등급 일괄 설정)
- [ ] 드래그앤드롭 파일 이동
- [ ] 관리자: 사용자 관리
- [ ] 관리자: 활동 로그 대시보드
- [ ] 관리자: 카테고리 트리 관리

### Phase 9: UI - 문서 상세
- [ ] 문서 정보 카드
- [ ] 인라인 미리보기 (PDF, 이미지, Office)
- [ ] 다운로드 버튼
- [ ] 댓글 시스템
- [ ] 활동 기록 연동

### Phase 10: 배포 & 마무리
- [ ] Vercel 프로젝트 설정
- [ ] 환경 변수 설정
- [ ] 커스텀 도메인 연결 (fileup.numbers.ai.kr)
- [ ] 기존 데이터 마이그레이션 실행
- [ ] 최종 테스트

---

## 6. 위험 요소 & 대응

| 위험 | 영향 | 대응 |
|------|------|------|
| 기존 데이터 손실 | 높음 | 마이그레이션 전 Supabase 백업, 단계적 전환 |
| Office 미리보기 제한 | 중간 | MS Online Viewer는 공개 URL 필요 → Supabase signed URL 활용 또는 서버사이드 변환 |
| Supabase Storage 용량 | 낮음 | 무료 1GB, Pro 100GB (10명 규모 충분) |
| Express → Next.js 전환 비용 | 중간 | API Route로 1:1 매핑, 점진적 전환 |
| FTS 한국어 지원 | 중간 | `simple` 사전 사용 (형태소 분석 없음), 필요 시 pg_bigm 확장 검토 |

---

## 7. 성공 기준

- [ ] 모든 파일 타입 업로드/다운로드 정상 동작
- [ ] 폴더 단위 벌크 업로드 가능
- [ ] PDF/이미지/Office 문서 인라인 미리보기
- [ ] FTS 검색으로 다중 키워드 검색 가능
- [ ] 태그 기반 문서 분류 및 필터링
- [ ] 모든 활동 로그 기록
- [ ] Vercel 배포 및 커스텀 도메인 정상 동작
- [ ] 모바일 반응형 UI
