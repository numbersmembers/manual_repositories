'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Download,
  Bookmark,
  BookmarkCheck,
  Shield,
  Search,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileIcon } from '@/components/file-icon'
import { formatFileSize, formatDate } from '@/lib/utils'
import { useUser } from '@/components/user-provider'
import { useDocumentSearch } from '@/hooks/use-documents'
import { useBookmarks } from '@/hooks/use-bookmarks'
import type { Document } from '@/lib/types'

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const user = useUser()
  const [query, setQuery] = useState(q)

  const { results, isLoading } = useDocumentSearch(q, user.email)
  const { bookmarkedIds, toggleBookmark } = useBookmarks(user.email)

  const handleSearch = () => {
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <>
      <Header title="검색 결과" />
      <div className="flex-1 p-6">
        {/* Search input */}
        <div className="relative max-w-xl mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="검색 (제목, 태그, 작성자)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            className="pl-9 h-10"
            autoFocus
          />
        </div>

        {/* Results info */}
        <p className="text-sm text-muted-foreground mb-4">
          {isLoading
            ? '검색 중...'
            : q
              ? `"${q}" 검색 결과 ${results.length}건`
              : '검색어를 입력해주세요'}
        </p>

        {/* Results list */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((doc: Document) => {
              const isBookmarked = bookmarkedIds.has(doc.id)
              return (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <FileIcon
                    fileName={doc.file_name}
                    fileExtension={doc.file_extension}
                    className="h-8 w-8 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      {doc.security_level === 'confidential' && (
                        <Badge variant="destructive" className="shrink-0 text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          대외비
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.file_name} · {doc.author_name} ·{' '}
                      {formatDate(doc.created_at)}
                      {doc.file_size && ` · ${formatFileSize(doc.file_size)}`}
                    </p>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {doc.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
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
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={`/api/documents/${doc.id}/download?user_email=${encodeURIComponent(user.email)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {!isLoading && q && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4" />
            <p>검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">로딩 중...</div>}>
      <SearchResults />
    </Suspense>
  )
}
