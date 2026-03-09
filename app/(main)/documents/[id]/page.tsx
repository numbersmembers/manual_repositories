'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  Bookmark,
  Trash2,
  Shield,
  FileText,
  Send,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatFileSize, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Document, Comment } from '@/lib/types'

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [doc, setDoc] = useState<Document | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [docRes, commentsRes] = await Promise.all([
          fetch(`/api/documents/${id}`),
          fetch(`/api/comments?document_id=${id}`),
        ])

        if (docRes.ok) setDoc(await docRes.json())
        if (commentsRes.ok) setComments(await commentsRes.json())
      } catch {
        toast.error('문서를 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('문서가 삭제되었습니다.')
      router.push('/documents')
    } else {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const handleBookmark = async () => {
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: id }),
    })
    if (res.ok) {
      const data = await res.json()
      toast.success(data.bookmarked ? '북마크 추가됨' : '북마크 제거됨')
    }
  }

  const handleComment = async () => {
    if (!newComment.trim()) return
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: id, content: newComment }),
    })
    if (res.ok) {
      const comment = await res.json()
      setComments((prev) => [...prev, comment])
      setNewComment('')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  if (loading) {
    return (
      <>
        <Header title="문서 상세" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">불러오는 중...</p>
        </div>
      </>
    )
  }

  if (!doc) {
    return (
      <>
        <Header title="문서 상세" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">문서를 찾을 수 없습니다.</p>
        </div>
      </>
    )
  }

  // 미리보기 URL (PDF, 이미지, Office)
  const isImage = doc.file_type?.startsWith('image/')
  const isPdf = doc.file_type === 'application/pdf'
  const isOffice = ['docx', 'xlsx', 'pptx'].includes(doc.file_extension || '')

  return (
    <>
      <Header title="문서 상세" />
      <div className="flex-1 p-6 max-w-4xl mx-auto space-y-6">
        {/* 상단 */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{doc.title}</h1>
              {doc.security_level === 'confidential' && (
                <Badge variant="destructive">
                  <Shield className="h-3 w-3 mr-1" />
                  대외비
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {doc.author_name} · {formatDateTime(doc.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBookmark}>
              <Bookmark className="h-4 w-4 mr-1" />
              북마크
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/documents/${id}/download`}>
                <Download className="h-4 w-4 mr-1" />
                다운로드
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
          </div>
        </div>

        {/* 파일 정보 */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">파일명:</span>{' '}
                {doc.file_name}
              </div>
              <div>
                <span className="text-muted-foreground">크기:</span>{' '}
                {doc.file_size ? formatFileSize(doc.file_size) : '-'}
              </div>
              <div>
                <span className="text-muted-foreground">형식:</span>{' '}
                {doc.file_extension?.toUpperCase() || doc.file_type}
              </div>
              <div>
                <span className="text-muted-foreground">보안등급:</span>{' '}
                {doc.security_level === 'confidential' ? '대외비' : '일반'}
              </div>
            </div>
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex gap-1 mt-4">
                {doc.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 미리보기 */}
        {(isPdf || isImage || isOffice) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              {isImage && (
                <img
                  src={`/api/documents/${id}/download`}
                  alt={doc.title}
                  className="max-w-full rounded-md"
                />
              )}
              {isPdf && (
                <iframe
                  src={`/api/documents/${id}/download`}
                  className="w-full h-[600px] rounded-md border"
                  title={doc.title}
                />
              )}
              {isOffice && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>Office 문서 미리보기는 다운로드 후 확인해주세요.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* 댓글 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              댓글 ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {comment.author_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(comment.created_at)}
                    </span>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-muted-foreground hover:text-destructive ml-auto"
                    >
                      삭제
                    </button>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Textarea
                placeholder="댓글을 작성하세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <Button
                size="icon"
                onClick={handleComment}
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
