'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield, Search, FileText } from 'lucide-react'
import { FileIcon } from '@/components/file-icon'
import { formatDate } from '@/lib/utils'
import { SECURITY_LEVEL_LABELS } from '@/lib/constants'
import { toast } from 'sonner'
import { useUser } from '@/components/user-provider'
import type { Document } from '@/lib/types'

export default function AdminSecurityPage() {
  const user = useUser()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('all')

  const fetchDocs = useCallback(async () => {
    try {
      // Fetch all documents as admin (no security_level filter)
      const res = await fetch(
        `/api/documents?limit=500&user_email=${encodeURIComponent(user.email)}`
      )
      if (res.ok) {
        const data = await res.json()
        setDocs(data.documents || [])
      }
    } catch {
      toast.error('문서 목록을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [user.email])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const changeSecurityLevel = async (docId: string, newLevel: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ security_level: newLevel }),
      })
      if (res.ok) {
        setDocs((prev) =>
          prev.map((d) =>
            d.id === docId ? { ...d, security_level: newLevel as Document['security_level'] } : d
          )
        )
        const label = SECURITY_LEVEL_LABELS[newLevel] || newLevel
        toast.success(`보안등급이 "${label}"(으)로 변경되었습니다.`)
      } else {
        toast.error('보안등급 변경에 실패했습니다.')
      }
    } catch {
      toast.error('보안등급 변경에 실패했습니다.')
    }
  }

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel =
      filterLevel === 'all' || doc.security_level === filterLevel
    return matchesSearch && matchesLevel
  })

  const generalCount = docs.filter((d) => d.security_level === 'general').length
  const confidentialCount = docs.filter((d) => d.security_level === 'confidential').length

  return (
    <>
      <Header title="문서 보안등급 관리" />
      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground font-medium">전체 문서</p>
            <p className="text-2xl font-black tracking-tight mt-1">{docs.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">일반</Badge>
              <p className="text-sm text-muted-foreground font-medium">일반 문서</p>
            </div>
            <p className="text-2xl font-black tracking-tight mt-1">{generalCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                대외비
              </Badge>
              <p className="text-sm text-muted-foreground font-medium">대외비 문서</p>
            </div>
            <p className="text-2xl font-black tracking-tight mt-1">{confidentialCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="문서명, 파일명, 작성자 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="general">일반</SelectItem>
              <SelectItem value="confidential">대외비</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-muted-foreground">불러오는 중...</p>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4" />
            <p>문서가 없습니다</p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>문서</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>보안등급</TableHead>
                  <TableHead>변경</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileIcon
                          fileName={doc.file_name}
                          fileExtension={doc.file_extension}
                          className="h-5 w-5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{doc.author_name}</TableCell>
                    <TableCell className="text-sm">{formatDate(doc.created_at)}</TableCell>
                    <TableCell>
                      {doc.security_level === 'confidential' ? (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          대외비
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">일반</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.security_level === 'general' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive text-xs h-7"
                          onClick={() => changeSecurityLevel(doc.id, 'confidential')}
                        >
                          대외비로 변경
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => changeSecurityLevel(doc.id, 'general')}
                        >
                          일반으로 변경
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}
