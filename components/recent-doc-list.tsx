'use client'

import Link from 'next/link'
import { FileText, Bookmark, BookmarkCheck } from 'lucide-react'
import { FileIcon } from '@/components/file-icon'
import { Button } from '@/components/ui/button'
import { useUser } from '@/components/user-provider'
import { useDocumentsPaginated } from '@/hooks/use-documents'
import { useBookmarks } from '@/hooks/use-bookmarks'
import type { Document } from '@/lib/types'

export function RecentDocList() {
  const user = useUser()
  // SWR-cached: 5 recent documents (reuses cache across navigation)
  const { documents, isLoading } = useDocumentsPaginated(user.email)
  const { bookmarkedIds, toggleBookmark } = useBookmarks(user.email)

  const recentDocs = documents.slice(0, 5)

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (recentDocs.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          아직 업로드된 문서가 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {recentDocs.map((doc) => {
        const isBookmarked = bookmarkedIds.has(doc.id)
        return (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}`}
            className="flex items-center justify-between rounded-lg border bg-card p-4 transition-all hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)] hover:border-primary/20"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <FileIcon fileName={doc.file_name} className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.author_name} · {doc.file_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => toggleBookmark(doc.id, e)}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 fill-current" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                {new Date(doc.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
