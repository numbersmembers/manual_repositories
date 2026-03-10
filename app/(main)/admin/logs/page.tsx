'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import type { ActivityLog } from '@/lib/types'

const ACTION_LABELS: Record<string, string> = {
  login: '로그인',
  logout: '로그아웃',
  upload: '업로드',
  download: '다운로드',
  view: '열람',
  delete: '삭제',
  move: '이동',
  create_folder: '폴더 생성',
  delete_folder: '폴더 삭제',
  approve_user: '사용자 승인',
  ban_user: '사용자 차단',
  change_role: '역할 변경',
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const limit = 30

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (actionFilter && actionFilter !== 'all') {
      params.set('action', actionFilter)
    }

    fetch(`/api/activity-logs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, actionFilter])

  const totalPages = Math.ceil(total / limit)

  const handleDeleteAll = async () => {
    if (!confirm('모든 활동 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    const res = await fetch('/api/activity-logs', { method: 'DELETE' })
    if (res.ok) {
      setLogs([])
      setTotal(0)
      toast.success('모든 활동 로그가 삭제되었습니다.')
    } else {
      toast.error('삭제에 실패했습니다.')
    }
  }

  return (
    <>
      <Header title="활동 로그" />
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">총 {total}건</p>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              <Trash2 className="h-4 w-4 mr-1" />
              전체 삭제
            </Button>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="전체 활동" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 활동</SelectItem>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">불러오는 중...</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>활동</TableHead>
                  <TableHead>대상</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.target_name || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
