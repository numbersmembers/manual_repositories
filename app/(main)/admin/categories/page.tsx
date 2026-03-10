'use client'

import { useEffect, useState } from 'react'
import { FolderPlus, Trash2, Folder } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Category } from '@/lib/types'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newParent, setNewParent] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setCategories(await res.json())
    } catch {
      // 에러 무시
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const createCategory = async () => {
    if (!newName.trim()) return

    const parentId = newParent && newParent !== 'none' ? newParent : null
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        parent_id: parentId,
      }),
    })

    if (res.ok) {
      toast.success('카테고리가 생성되었습니다.')
      setNewName('')
      setNewParent('')
      setDialogOpen(false)
      fetchCategories()
    } else {
      const data = await res.json().catch(() => null)
      toast.error(data?.error || '생성에 실패했습니다.')
    }
  }

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?\n하위 문서도 함께 삭제됩니다.`))
      return

    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('카테고리가 삭제되었습니다.')
      fetchCategories()
    } else {
      toast.error('삭제에 실패했습니다.')
    }
  }

  return (
    <>
      <Header title="카테고리 관리" />
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {categories.length}개 카테고리
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FolderPlus className="h-4 w-4 mr-2" />
                새 카테고리
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 카테고리 만들기</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>카테고리 이름</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="예: 업무 매뉴얼"
                  />
                </div>
                <div className="space-y-2">
                  <Label>상위 카테고리 (선택)</Label>
                  <Select value={newParent} onValueChange={setNewParent}>
                    <SelectTrigger>
                      <SelectValue placeholder="최상위" />
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
                </div>
                <Button onClick={createCategory} className="w-full">
                  만들기
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">불러오는 중...</p>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4" />
            <p>카테고리가 없습니다. 첫 카테고리를 만들어보세요.</p>
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
                  onClick={() => deleteCategory(cat.id, cat.name)}
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
