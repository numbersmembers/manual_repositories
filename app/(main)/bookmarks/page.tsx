'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Bookmark } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { formatDate } from '@/lib/utils'
import { useUser } from '@/components/user-provider'

type BookmarkItem = {
  id: string
  document_id: string
  created_at: string
  documents: {
    id: string
    title: string
    file_name: string
    file_type: string
    file_extension: string | null
    created_at: string
  }
}

export default function BookmarksPage() {
  const user = useUser()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/bookmarks?user_email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBookmarks(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user.email])

  return (
    <>
      <Header title="북마크" />
      <div className="flex-1 p-6">
        {loading ? (
          <p className="text-muted-foreground">불러오는 중...</p>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bookmark className="h-12 w-12 mb-4" />
            <p>북마크한 문서가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((bm) => (
              <Link
                key={bm.id}
                href={`/documents/${bm.documents.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {bm.documents.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bm.documents.file_name} · {formatDate(bm.documents.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
