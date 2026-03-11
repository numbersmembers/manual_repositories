'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  FolderPlus,
  Trash2,
  Folder,
  FolderOpen,
  Loader2,
  ChevronRight,
  ChevronDown,
  Plus,
  GripVertical,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { naturalCompare } from '@/lib/utils'
import type { Category } from '@/lib/types'

type TreeNode = Omit<Category, 'children'> & { children: TreeNode[] }

function buildSortedTree(categories: Category[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] })
  })

  categories.forEach((cat) => {
    const node = map.get(cat.id)!
    if (cat.parent_id) {
      const parent = map.get(cat.parent_id)
      if (parent) parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return naturalCompare(a.name, b.name)
    })
    nodes.forEach((n) => sortNodes(n.children))
  }

  sortNodes(roots)
  return roots
}

function SortableCategoryItem({
  node,
  depth,
  expandedIds,
  toggleExpand,
  subfolderTarget,
  setSubfolderTarget,
  subfolderName,
  setSubfolderName,
  handleCreateSubfolder,
  handleDelete,
  isPending,
  maxDepthReached,
}: {
  node: TreeNode
  depth: number
  expandedIds: Set<string>
  toggleExpand: (id: string) => void
  subfolderTarget: string | null
  setSubfolderTarget: (id: string | null) => void
  subfolderName: string
  setSubfolderName: (name: string) => void
  handleCreateSubfolder: (parentId: string) => Promise<void>
  handleDelete: (id: string, name: string) => Promise<void>
  isPending: boolean
  maxDepthReached: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`
          flex items-center gap-2 rounded-xl border bg-card p-3 mb-1.5
          transition-all hover:shadow-sm
          ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary/20' : ''}
        `}
        style={{ marginLeft: depth * 28 }}
      >
        {/* Drag handle */}
        <button
          className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        </button>

        {/* Expand/Collapse toggle */}
        {hasChildren ? (
          <button
            className="p-0.5 rounded hover:bg-muted"
            onClick={() => toggleExpand(node.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Folder icon + name */}
        {hasChildren && isExpanded ? (
          <FolderOpen className="h-5 w-5 text-primary/70 shrink-0" />
        ) : (
          <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{node.name}</p>
          {depth > 0 && (
            <p className="text-xs text-muted-foreground truncate">{node.path}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-0.5 shrink-0">
          {!maxDepthReached && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="하위 폴더 추가"
              onClick={() => {
                setSubfolderTarget(subfolderTarget === node.id ? null : node.id)
                setSubfolderName('')
              }}
              disabled={isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handleDelete(node.id, node.name)}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Inline subfolder creation */}
      {subfolderTarget === node.id && (
        <div
          className="flex gap-2 mb-1.5"
          style={{ marginLeft: (depth + 1) * 28 }}
        >
          <Input
            value={subfolderName}
            onChange={(e) => setSubfolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSubfolder(node.id)
              if (e.key === 'Escape') setSubfolderTarget(null)
            }}
            placeholder={`"${node.name}" 하위 폴더 이름`}
            disabled={isPending}
            className="flex-1 rounded-xl"
            autoFocus
          />
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => handleCreateSubfolder(node.id)}
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

      {/* Children (rendered if expanded) */}
      {hasChildren && isExpanded && (
        <SortableContext
          items={node.children.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {node.children.map((child) => (
            <SortableCategoryItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              subfolderTarget={subfolderTarget}
              setSubfolderTarget={setSubfolderTarget}
              subfolderName={subfolderName}
              setSubfolderName={setSubfolderName}
              handleCreateSubfolder={handleCreateSubfolder}
              handleDelete={handleDelete}
              isPending={isPending}
              maxDepthReached={child.path.split('/').length >= 10}
            />
          ))}
        </SortableContext>
      )}
    </div>
  )
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [subfolderTarget, setSubfolderTarget] = useState<string | null>(null)
  const [subfolderName, setSubfolderName] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchCategories = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const tree = buildSortedTree(categories)

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCreate = async () => {
    if (!newName.trim() || isPending) return
    setIsPending(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (res.ok) {
        toast.success('카테고리가 생성되었습니다.')
        setNewName('')
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
        setExpandedIds((prev) => new Set([...prev, parentCatId]))
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
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?\n하위 폴더도 함께 삭제됩니다.`)) return
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Find siblings at same level
    const draggedCat = categories.find((c) => c.id === active.id)
    const overCat = categories.find((c) => c.id === over.id)
    if (!draggedCat || !overCat) return

    // Only allow reorder within same parent
    if (draggedCat.parent_id !== overCat.parent_id) return

    const siblings = categories
      .filter((c) => c.parent_id === draggedCat.parent_id)
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
        return naturalCompare(a.name, b.name)
      })

    const oldIndex = siblings.findIndex((c) => c.id === active.id)
    const newIndex = siblings.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // Reorder
    const reordered = [...siblings]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    // Assign new sort_order values
    const items = reordered.map((cat, idx) => ({
      id: cat.id,
      sort_order: idx,
    }))

    // Optimistic update
    setCategories((prev) =>
      prev.map((cat) => {
        const updated = items.find((i) => i.id === cat.id)
        return updated ? { ...cat, sort_order: updated.sort_order } : cat
      })
    )

    // Persist
    try {
      await fetch('/api/categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
    } catch {
      toast.error('정렬 순서 저장에 실패했습니다.')
      fetchCategories()
    }
  }

  // Collect all sortable IDs (flattened from visible tree)
  const collectIds = (nodes: TreeNode[]): string[] =>
    nodes.flatMap((n) => [
      n.id,
      ...(expandedIds.has(n.id) ? collectIds(n.children) : []),
    ])

  const allVisibleIds = collectIds(tree)

  return (
    <>
      <Header title="카테고리 관리" />
      <div className="flex-1 p-6 max-w-2xl">
        {/* Create root category */}
        <div className="flex gap-2 mb-6">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            placeholder="새 최상위 카테고리 이름 입력"
            disabled={isPending}
            className="flex-1 rounded-xl"
          />
          <Button
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            className="rounded-xl"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderPlus className="h-4 w-4 mr-2" />
            )}
            {isPending ? '생성 중...' : '추가'}
          </Button>
        </div>

        {/* Category count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {categories.length}개 카테고리
          </p>
          <p className="text-xs text-muted-foreground">
            드래그하여 같은 레벨 내 순서를 변경할 수 있습니다
          </p>
        </div>

        {/* Category tree with DnD */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            불러오는 중...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4" />
            <p>카테고리가 없습니다. 위에서 첫 카테고리를 만들어보세요.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={allVisibleIds}
              strategy={verticalListSortingStrategy}
            >
              {tree.map((node) => (
                <SortableCategoryItem
                  key={node.id}
                  node={node}
                  depth={0}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  subfolderTarget={subfolderTarget}
                  setSubfolderTarget={setSubfolderTarget}
                  subfolderName={subfolderName}
                  setSubfolderName={setSubfolderName}
                  handleCreateSubfolder={handleCreateSubfolder}
                  handleDelete={handleDelete}
                  isPending={isPending}
                  maxDepthReached={node.path.split('/').length >= 10}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </>
  )
}
