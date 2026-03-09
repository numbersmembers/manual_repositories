import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, FolderOpen, Users, Upload } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // 통계 조회
  const [docsRes, catsRes, recentRes] = await Promise.all([
    supabase.from('documents').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase
      .from('documents')
      .select('id, title, file_name, file_type, author_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const docCount = docsRes.count ?? 0
  const catCount = catsRes.count ?? 0
  const recentDocs = recentRes.data ?? []

  return (
    <>
      <Header title="대시보드" />
      <div className="flex-1 space-y-6 p-6">
        {/* 인사말 */}
        <div>
          <h2 className="text-2xl font-black tracking-tight">{user.name}님, 환영합니다</h2>
          <p className="text-muted-foreground">
            Bloter/Numbers 업무 매뉴얼 문서함
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">전체 문서</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{docCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">카테고리</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{catCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">빠른 메뉴</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link
                href="/upload"
                className="text-sm text-primary hover:underline"
              >
                파일 업로드하기 →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 최근 문서 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 업로드 문서</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                아직 업로드된 문서가 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.author_name} · {doc.file_name}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
