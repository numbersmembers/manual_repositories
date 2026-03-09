'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { ROLE_LABELS, STATUS_LABELS } from '@/lib/constants'
import type { User } from '@/lib/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) setUsers(await res.json())
    } catch {
      // 에러 무시
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const updateUser = async (
    userId: string,
    updates: { status?: string; role?: string }
  ) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      toast.success('사용자 정보가 변경되었습니다.')
      fetchUsers()
    } else {
      toast.error('변경에 실패했습니다.')
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const
      case 'banned':
        return 'destructive' as const
      default:
        return 'secondary' as const
    }
  }

  return (
    <>
      <Header title="사용자 관리" />
      <div className="flex-1 p-6">
        {loading ? (
          <p className="text-muted-foreground">불러오는 중...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용자</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(role) =>
                        updateUser(user.id, { role })
                      }
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">
                          {ROLE_LABELS.staff}
                        </SelectItem>
                        <SelectItem value="admin">
                          {ROLE_LABELS.admin}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(user.status)}>
                      {STATUS_LABELS[user.status] || user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateUser(user.id, { status: 'active' })
                          }
                        >
                          승인
                        </Button>
                      )}
                      {user.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() =>
                            updateUser(user.id, { status: 'banned' })
                          }
                        >
                          차단
                        </Button>
                      )}
                      {user.status === 'banned' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateUser(user.id, { status: 'active' })
                          }
                        >
                          해제
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  )
}
