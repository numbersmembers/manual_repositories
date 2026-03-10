'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { FileText, Bookmark, BookmarkCheck } from 'lucide-react'
import { FileIcon } from '@/components/file-icon'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useUser } from '@/components/user-provider'

type RecentDoc = {
  id: string
  title: string
  file_name: string
  file_type: string
  file_extension?: string | null
  security_level?: string
  author_name: string
  created_at: string
}

export function RecentDocList() {
  const user = useUser()
  const [docs, setDocs] = useState<RecentDoc[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/documents?limit=5&user_email=${encodeURIComponent(user.email)}`
      )
      if (res.ok) {
        const data = await res.json()
        setDocs(data.documents || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [user.email])

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/bookmarks?user_email=${encodeURIComponent(user.email)}`
      )
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setBookmarkedIds(
            new Set(data.map((bm: { document_id: string }) => bm.document_id))
          )
        }
      }
    } catch {
      // ignore
    }
  }, [user.email])

  useEffect(() => {
    fetchDocs()
    fetchBookmarks()
  }, [fetchDocs, fetchBookmarks])

  const toggleBookmark = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId, user_email: user.email }),
      })
      if (res.ok) {
        const data = await res.json()
        setBookmarkedIds((prev) => {
          const next = new Set(prev)
          if (data.bookmarked) {
            next.add(docId)
          } else {
            next.delete(docId)
          }
          return next
        })
        toast.success(data.bookmarked ? '북마크 추가됨' : '북마크 제거됨')
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (docs.length === 0) {
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
      {docs.map((doc) => {
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
