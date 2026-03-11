'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, FolderOpen, ChevronRight } from 'lucide-react'
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
import { formatFileSize, naturalCompare } from '@/lib/utils'
import { useUser } from '@/components/user-provider'
import type { Category } from '@/lib/types'

type UploadItem = {
  file: File
  title: string
  tags: string[]
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
}

// Read all files recursively from FileSystemEntry (supports folder drops)
function readEntriesRecursively(entries: FileSystemEntry[]): Promise<File[]> {
  const files: File[] = []

  function readEntry(entry: FileSystemEntry): Promise<void> {
    return new Promise((resolve) => {
      if (entry.isFile) {
        ;(entry as FileSystemFileEntry).file((file) => {
          if (!file.name.startsWith('.')) files.push(file)
          resolve()
        }, () => resolve())
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader()
        reader.readEntries(async (childEntries) => {
          await Promise.all(childEntries.map(readEntry))
          resolve()
        }, () => resolve())
      } else {
        resolve()
      }
    })
  }

  return Promise.all(entries.map(readEntry)).then(() => files)
}

const MAX_DEPTH = 10
const LEVEL_LABELS = [
  '최상위', '1단계', '2단계', '3단계', '4단계',
  '5단계', '6단계', '7단계', '8단계', '9단계',
]

function CascadeCategorySelector({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  // selections[i] = selected category id at depth i
  const [selections, setSelections] = useState<string[]>([])

  // Get children of a parent (null = roots), sorted naturally
  const getChildren = useCallback(
    (parentId: string | null) =>
      categories
        .filter((c) =>
          parentId === null ? !c.parent_id : c.parent_id === parentId
        )
        .sort((a, b) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
          return naturalCompare(a.name, b.name)
        }),
    [categories]
  )

  // Initialize selections from selectedId (rebuild path)
  useEffect(() => {
    if (!selectedId || categories.length === 0) {
      setSelections([])
      return
    }
    const path: string[] = []
    let current = categories.find((c) => c.id === selectedId)
    while (current) {
      path.unshift(current.id)
      current = current.parent_id
        ? categories.find((c) => c.id === current!.parent_id)
        : undefined
    }
    setSelections(path)
  }, [selectedId, categories])

  // Build cascade levels to display
  const levels = useMemo(() => {
    const result: { parentId: string | null; options: Category[] }[] = []
    const roots = getChildren(null)
    if (roots.length === 0) return result

    result.push({ parentId: null, options: roots })

    for (let i = 0; i < selections.length && i < MAX_DEPTH - 1; i++) {
      const children = getChildren(selections[i])
      if (children.length === 0) break
      result.push({ parentId: selections[i], options: children })
    }

    return result
  }, [selections, getChildren])

  const handleSelect = (depth: number, value: string) => {
    const newSelections = [...selections.slice(0, depth), value]
    setSelections(newSelections)
    onSelect(value)
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        카테고리가 없습니다. 관리자 설정에서 먼저 생성해주세요.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {levels.map((level, depth) => (
        <div key={depth} className="flex items-center gap-2">
          {depth > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="flex-1">
            <Select
              value={selections[depth] || ''}
              onValueChange={(val) => handleSelect(depth, val)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={`${LEVEL_LABELS[depth]} 선택`} />
              </SelectTrigger>
              <SelectContent>
                {level.options.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
      {/* Show selected path */}
      {selections.length > 0 && (
        <p className="text-xs text-muted-foreground pl-1">
          {categories.find((c) => c.id === selections[selections.length - 1])?.path || ''}
        </p>
      )}
    </div>
  )
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

  const addFiles = (files: File[]) => {
    const validFiles = files.filter((f) => f.size > 0)
    if (validFiles.length === 0) return
    const newItems: UploadItem[] = validFiles.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      tags: [],
      status: 'pending',
      progress: 0,
    }))
    setItems((prev) => [...prev, ...newItems])
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    addFiles(Array.from(files))
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()

    const dropItems = e.dataTransfer.items
    if (dropItems && dropItems.length > 0) {
      const entries: FileSystemEntry[] = []
      for (let i = 0; i < dropItems.length; i++) {
        const entry = dropItems[i].webkitGetAsEntry?.()
        if (entry) entries.push(entry)
      }

      if (entries.some((entry) => entry.isDirectory)) {
        const allFiles = await readEntriesRecursively(entries)
        addFiles(allFiles)
        return
      }
    }

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
        {/* Category cascade selector + Security level */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
          <div className="space-y-2">
            <Label>카테고리 (10단계 계층 선택)</Label>
            <CascadeCategorySelector
              categories={categories}
              selectedId={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
          <div className="space-y-2">
            <Label>보안등급</Label>
            <Select value={securityLevel} onValueChange={setSecurityLevel}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">일반</SelectItem>
                <SelectItem value="confidential">대외비</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Drag & drop area */}
        <div
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
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

        {/* Upload queue */}
        {items.length > 0 && (
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                업로드 대기열 ({items.length}개)
              </CardTitle>
              <Button onClick={uploadAll} disabled={uploading} className="rounded-xl">
                {uploading ? '업로드 중...' : '전체 업로드'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          updateItem(index, { title: e.target.value })
                        }
                        placeholder="문서 제목"
                        className="h-8 text-sm rounded-lg"
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

                  {/* Tags */}
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
                        className="h-7 w-32 text-xs rounded-lg"
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
