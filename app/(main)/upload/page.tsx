'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, FolderOpen } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/utils'
import { useUser } from '@/components/user-provider'
import type { Category } from '@/lib/types'

interface UploadItem {
  file: File
  title: string
  tags: string[]
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
}

export default function UploadPage() {
  const router = useRouter()
  const user = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [securityLevel, setSecurityLevel] = useState<string>('general')
  const [items, setItems] = useState<UploadItem[]>([])
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      tags: [],
      status: 'pending',
      progress: 0,
    }))
    setItems((prev) => [...prev, ...newItems])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, updates: Partial<UploadItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    )
  }

  const addTagToItem = (index: number) => {
    if (!tagInput.trim()) return
    setItems((prev) =>
      prev.map((item, i) =>
        i === index && !item.tags.includes(tagInput.trim())
          ? { ...item, tags: [...item.tags, tagInput.trim()] }
          : item
      )
    )
    setTagInput('')
  }

  const removeTagFromItem = (index: number, tag: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, tags: item.tags.filter((t) => t !== tag) }
          : item
      )
    )
  }

  const uploadAll = async () => {
    if (!selectedCategory) {
      toast.error('카테고리를 선택해주세요.')
      return
    }
    if (items.length === 0) {
      toast.error('파일을 추가해주세요.')
      return
    }

    setUploading(true)
    let successCount = 0

    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue

      updateItem(i, { status: 'uploading', progress: 0 })

      const formData = new FormData()
      formData.append('file', items[i].file)
      formData.append('title', items[i].title)
      formData.append('category_id', selectedCategory)
      formData.append('security_level', securityLevel)
      formData.append('user_email', user.email)
      if (items[i].tags.length > 0) {
        formData.append('tags', JSON.stringify(items[i].tags))
      }

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          updateItem(i, { status: 'done', progress: 100 })
          successCount++
        } else {
          const data = await res.json()
          updateItem(i, {
            status: 'error',
            error: data.error || '업로드 실패',
          })
        }
      } catch {
        updateItem(i, { status: 'error', error: '네트워크 오류' })
      }
    }

    setUploading(false)
    if (successCount > 0) {
      toast.success(`${successCount}개 파일 업로드 완료`)
    }
  }

  return (
    <>
      <Header title="파일 업로드" />
      <div className="flex-1 p-6 max-w-3xl mx-auto space-y-6">
        {/* 카테고리 & 보안등급 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>카테고리</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // Recursive tree flattening for unlimited depth
                  const flattenTree = (parentId: string | null, depth: number): { cat: Category; depth: number }[] => {
                    const children = categories.filter((c) =>
                      parentId === null ? !c.parent_id : c.parent_id === parentId
                    )
                    return children.flatMap((child) => [
                      { cat: child, depth },
                      ...flattenTree(child.id, depth + 1),
                    ])
                  }
                  return flattenTree(null, 0).map(({ cat, depth }) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        {depth > 0 ? `${'  '.repeat(depth - 1)}└ ${cat.name}` : cat.name}
                      </div>
                    </SelectItem>
                  ))
                })()}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>보안등급</Label>
            <Select value={securityLevel} onValueChange={setSecurityLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">일반</SelectItem>
                <SelectItem value="confidential">대외비</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 드래그 & 드롭 영역 */}
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">파일을 드래그하거나 클릭하여 선택</p>
          <p className="text-xs text-muted-foreground mt-1">
            모든 파일 형식 지원 · 여러 파일 동시 업로드 가능
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* 업로드 대기열 */}
        {items.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                업로드 대기열 ({items.length}개)
              </CardTitle>
              <Button onClick={uploadAll} disabled={uploading}>
                {uploading ? '업로드 중...' : '전체 업로드'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          updateItem(index, { title: e.target.value })
                        }
                        placeholder="문서 제목"
                        className="h-8 text-sm"
                        disabled={item.status === 'done'}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.file.name} · {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    {item.status === 'done' ? (
                      <Badge variant="default">완료</Badge>
                    ) : item.status === 'error' ? (
                      <Badge variant="destructive">{item.error}</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* 태그 */}
                  {item.status !== 'done' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeTagFromItem(index, tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                      <Input
                        placeholder="태그 입력 후 Enter"
                        className="h-7 w-32 text-xs"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTagToItem(index)
                          }
                        }}
                      />
                    </div>
                  )}

                  {item.status === 'uploading' && (
                    <Progress value={item.progress} className="h-1" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
