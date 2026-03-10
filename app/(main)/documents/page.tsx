'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Download,
  Grid3X3,
  List,
  Bookmark,
  BookmarkCheck,
  Shield,
  FolderOpen,
  Calendar,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileIcon } from '@/components/file-icon'
import { cn, formatFileSize, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useUser } from '@/components/user-provider'
import type { Document, Category } from '@/lib/types'

type GroupMode = 'all' | 'folder' | 'date'

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  const user = useUser()
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [groupMode, setGroupMode] = useState<GroupMode>('all')
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryId) params.set('category_id', categoryId)
      const res = await fetch(`/api/documents?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents)
        setTotal(data.total)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [categoryId])

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
    fetchDocuments()
    fetchBookmarks()
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [fetchDocuments, fetchBookmarks])

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
      } else {
        toast.error('북마크 처리에 실패했습니다.')
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    }
  }

  // Build category name map
  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach((c) => {
      map[c.id] = c.path || c.name
    })
    return map
  }, [categories])

  // Group documents by folder or date
  const groupedDocs = useMemo(() => {
    if (groupMode === 'all') return null

    const groups: Record<string, Document[]> = {}

    if (groupMode === 'folder') {
      documents.forEach((doc) => {
        const key = categoryNameMap[doc.category_id] || '미분류'
        if (!groups[key]) groups[key] = []
        groups[key].push(doc)
      })
    } else {
      // Group by date (YYYY.MM.DD)
      documents.forEach((doc) => {
        const date = new Date(doc.created_at)
        const key = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
        if (!groups[key]) groups[key] = []
        groups[key].push(doc)
      })
    }

    // Sort group keys
    const sortedKeys = Object.keys(groups).sort((a, b) =>
      groupMode === 'date' ? b.localeCompare(a) : a.localeCompare(b)
    )
    return sortedKeys.map((key) => ({ label: key, docs: groups[key] }))
  }, [documents, groupMode, categoryNameMap])

  const renderDocItem = (doc: Document) => {
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
              {doc.tags.map((tag) => (
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
  }

  const renderGridItem = (doc: Document) => (
    <Link
      key={doc.id}
      href={`/documents/${doc.id}`}
      className="rounded-lg border p-4 hover:bg-accent transition-colors flex flex-col"
    >
      <FileIcon
        fileName={doc.file_name}
        fileExtension={doc.file_extension}
        className="h-10 w-10 mb-3"
      />
      <p className="text-sm font-medium truncate">{doc.title}</p>
      <p className="text-xs text-muted-foreground truncate mt-1">
        {doc.file_name}
      </p>
      <p className="text-xs text-muted-foreground mt-auto pt-2">
        {formatDate(doc.created_at)}
      </p>
    </Link>
  )

  return (
    <>
      <Header title="문서함" />
      <div className="flex-1 p-6">
        {/* 툴바 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? '불러오는 중...' : `총 ${total}개 문서`}
          </p>
          <div className="flex gap-1">
            {/* 그룹 모드 */}
            <div className="flex gap-1 mr-2 border-r pr-2">
              <Button
                variant={groupMode === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setGroupMode('all')}
              >
                전체
              </Button>
              <Button
                variant={groupMode === 'folder' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setGroupMode('folder')}
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                폴더별
              </Button>
              <Button
                variant={groupMode === 'date' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setGroupMode('date')}
              >
                <Calendar className="h-4 w-4 mr-1" />
                날짜별
              </Button>
            </div>
            {/* 뷰 모드 */}
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 문서 목록 */}
        {documents.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4" />
            <p>문서가 없습니다</p>
          </div>
        ) : groupMode !== 'all' && groupedDocs ? (
          // Grouped view
          <div className="space-y-6">
            {groupedDocs.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3">
                  {groupMode === 'folder' ? (
                    <FolderOpen className="h-4 w-4 text-primary" />
                  ) : (
                    <Calendar className="h-4 w-4 text-primary" />
                  )}
                  <h3 className="text-sm font-bold tracking-tight">
                    {group.label}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    ({group.docs.length})
                  </span>
                </div>
                {viewMode === 'list' ? (
                  <div className="space-y-2">
                    {group.docs.map(renderDocItem)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {group.docs.map(renderGridItem)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {documents.map(renderDocItem)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {documents.map(renderGridItem)}
          </div>
        )}
      </div>
    </>
  )
}
