'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Download,
  Grid3X3,
  List,
  Bookmark,
  Shield,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatFileSize, formatDate } from '@/lib/utils'
import type { Document } from '@/lib/types'

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  const [documents, setDocuments] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

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
      // 에러 무시
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const toggleBookmark = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault()
    await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: docId }),
    })
  }

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
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
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
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="rounded-lg border p-4 hover:bg-accent transition-colors flex flex-col"
              >
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {doc.file_name}
                </p>
                <p className="text-xs text-muted-foreground mt-auto pt-2">
                  {formatDate(doc.created_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
