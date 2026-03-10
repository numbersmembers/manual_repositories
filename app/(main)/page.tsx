import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { FileText, FolderOpen, Upload, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Layout already handles auth — page just needs user data for display
  const user = await getAuthUser()

  const supabase = createServiceClient()

  let docCount = 0
  let catCount = 0
  let recentDocs: { id: string; title: string; file_name: string; file_type: string; author_name: string; created_at: string }[] = []

  try {
    const [docsRes, catsRes, recentRes] = await Promise.all([
      supabase.from('documents').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase
        .from('documents')
        .select('id, title, file_name, file_type, author_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    docCount = docsRes.count ?? 0
    catCount = catsRes.count ?? 0
    recentDocs = recentRes.data ?? []
  } catch {
    // DB query failure should not crash the page
  }

  return (
    <>
      <Header title="대시보드" />
      <div className="flex-1 space-y-8 p-6">
        {/* 인사말 */}
        <div>
          <h2 className="text-3xl font-black tracking-tight">{user?.name ?? '사용자'}님, 환영합니다</h2>
          <p className="mt-1 text-muted-foreground">
            Bloter/Numbers 업무 매뉴얼 문서함
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-tight text-muted-foreground">전체 문서</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight">{docCount}</div>
          </div>
          <div className="rounded-lg border bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-tight text-muted-foreground">카테고리</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <FolderOpen className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight">{catCount}</div>
          </div>
          <Link
            href="/upload"
            className="group rounded-lg border bg-primary p-5 text-primary-foreground shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08)] hover:opacity-95"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-tight opacity-80">파일 업로드</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <Upload className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-lg font-bold">
              업로드하기
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* 최근 문서 */}
        <div>
          <h3 className="mb-4 text-lg font-bold tracking-tight">최근 업로드 문서</h3>
          {recentDocs.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                아직 업로드된 문서가 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between rounded-lg border bg-card p-4 transition-all hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)] hover:border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.author_name} · {doc.file_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
