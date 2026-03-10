'use client'

import { useEffect, useState } from 'react'
import {
  FolderPlus,
  Trash2,
  Folder,
  Loader2,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Category } from '@/lib/types'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [parentId, setParentId] = useState<string>('none')
  const [isPending, setIsPending] = useState(false)
  const [subfolderTarget, setSubfolderTarget] = useState<string | null>(null)
  const [subfolderName, setSubfolderName] = useState('')

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Build tree structure
  const rootCategories = categories.filter((c) => !c.parent_id)
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId)

  const handleCreate = async () => {
    if (!newName.trim() || isPending) return
    setIsPending(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          parent_id: parentId !== 'none' ? parentId : null,
        }),
      })

      if (res.ok) {
        toast.success('카테고리가 생성되었습니다.')
        setNewName('')
        setParentId('none')
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || '생성에 실패했습니다.')
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setIsPending(false)
    }
  }

  const handleCreateSubfolder = async (parentCatId: string) => {
    if (!subfolderName.trim() || isPending) return
    setIsPending(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subfolderName.trim(),
          parent_id: parentCatId,
        }),
      })

      if (res.ok) {
        toast.success('하위 폴더가 생성되었습니다.')
        setSubfolderName('')
        setSubfolderTarget(null)
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || '생성에 실패했습니다.')
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return
    setIsPending(true)

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })

      if (res.ok) {
        toast.success('카테고리가 삭제되었습니다.')
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || '삭제에 실패했습니다.')
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setIsPending(false)
    }
  }

  const renderCategory = (cat: Category, depth: number = 0) => {
    const children = getChildren(cat.id)
    return (
      <div key={cat.id}>
        <div
          className="flex items-center justify-between rounded-lg border p-3"
          style={{ marginLeft: depth * 24 }}
        >
          <div className="flex items-center gap-3">
            {depth > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            <Folder className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{cat.name}</p>
              <p className="text-xs text-muted-foreground">{cat.path}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="하위 폴더 추가"
              onClick={() => {
                setSubfolderTarget(
                  subfolderTarget === cat.id ? null : cat.id
                )
                setSubfolderName('')
              }}
              disabled={isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
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
        </div>

        {/* Inline subfolder creation */}
        {subfolderTarget === cat.id && (
          <div
            className="flex gap-2 mt-1 mb-1"
            style={{ marginLeft: (depth + 1) * 24 }}
          >
            <Input
              value={subfolderName}
              onChange={(e) => setSubfolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubfolder(cat.id)
                if (e.key === 'Escape') setSubfolderTarget(null)
              }}
              placeholder={`"${cat.name}" 하위 폴더 이름`}
              disabled={isPending}
              className="flex-1"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => handleCreateSubfolder(cat.id)}
              disabled={isPending || !subfolderName.trim()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '추가'
              )}
            </Button>
          </div>
        )}

        {/* Render children */}
        {children.map((child) => renderCategory(child, depth + 1))}
      </div>
    )
  }

  return (
    <>
      <Header title="카테고리 관리" />
      <div className="flex-1 p-6 max-w-2xl">
        {/* 카테고리 추가 */}
        <div className="flex gap-2 mb-6">
          <Select value={parentId} onValueChange={setParentId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="상위 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">최상위</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            {rootCategories.map((cat) => renderCategory(cat))}
          </div>
        )}
      </div>
    </>
  )
}
