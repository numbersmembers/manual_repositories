'use client'

import { useEffect, useState, useTransition } from 'react'
import { FolderPlus, Trash2, Folder, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  createCategory,
  deleteCategory,
  getCategories,
} from '@/lib/actions/categories'
import type { Category } from '@/lib/types'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [isPending, startTransition] = useTransition()

  const fetchCategories = async () => {
    const data = await getCategories()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = () => {
    if (!newName.trim()) return

    startTransition(async () => {
      const result = await createCategory(newName.trim(), null)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('카테고리가 생성되었습니다.')
        setNewName('')
        fetchCategories()
      }
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return

    startTransition(async () => {
      const result = await deleteCategory(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('카테고리가 삭제되었습니다.')
        fetchCategories()
      }
    })
  }

  return (
    <>
      <Header title="카테고리 관리" />
      <div className="flex-1 p-6 max-w-2xl">
        {/* 인라인 카테고리 추가 */}
        <div className="flex gap-2 mb-6">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            placeholder="새 카테고리 이름 입력"
            disabled={isPending}
            className="flex-1"
          />
          <Button onClick={handleCreate} disabled={isPending || !newName.trim()}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderPlus className="h-4 w-4 mr-2" />
            )}
            {isPending ? '생성 중...' : '추가'}
          </Button>
        </div>

        {/* 카테고리 목록 */}
        <p className="text-sm text-muted-foreground mb-3">
          {categories.length}개 카테고리
        </p>

        {loading ? (
          <p className="text-muted-foreground">불러오는 중...</p>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4" />
            <p>카테고리가 없습니다. 위에서 첫 카테고리를 만들어보세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.path}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
