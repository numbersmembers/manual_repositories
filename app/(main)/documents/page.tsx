'use client'

import { useState, useMemo, memo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Download,
  Grid3X3,
  List,
  Bookmark,
  BookmarkCheck,
  Shield,
  FolderOpen,
  Folder,
  Calendar,
  ChevronRight,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileIcon } from '@/components/file-icon'
import { cn, formatFileSize, formatDate, naturalCompare } from '@/lib/utils'
import { useUser } from '@/components/user-provider'
import { useDocumentsPaginated, useDocumentsAll } from '@/hooks/use-documents'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { useCategories } from '@/hooks/use-categories'
import type { Document, Category } from '@/lib/types'

type GroupMode = 'all' | 'folder' | 'date'

type FolderTreeNode = {
  category: Category
  docs: Document[]
  children: FolderTreeNode[]
}

function buildFolderTree(
  categories: Category[],
  documents: Document[]
): FolderTreeNode[] {
  const catMap = new Map<string, FolderTreeNode>()

  categories.forEach((cat) => {
    catMap.set(cat.id, { category: cat, docs: [], children: [] })
  })

  documents.forEach((doc) => {
    const node = catMap.get(doc.category_id)
    if (node) node.docs.push(doc)
  })

  const roots: FolderTreeNode[] = []
  categories.forEach((cat) => {
    const node = catMap.get(cat.id)!
    if (cat.parent_id) {
      const parent = catMap.get(cat.parent_id)
      if (parent) parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodes: FolderTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.category.sort_order !== b.category.sort_order)
        return a.category.sort_order - b.category.sort_order
      return naturalCompare(a.category.name, b.category.name)
    })
    nodes.forEach((n) => sortNodes(n.children))
  }
  sortNodes(roots)

  const hasDocsInSubtree = (node: FolderTreeNode): boolean =>
    node.docs.length > 0 || node.children.some(hasDocsInSubtree)

  const filterEmpty = (nodes: FolderTreeNode[]): FolderTreeNode[] =>
    nodes
      .filter(hasDocsInSubtree)
      .map((n) => ({ ...n, children: filterEmpty(n.children) }))

  return filterEmpty(roots)
}

function countDocsInSubtree(node: FolderTreeNode): number {
  return node.docs.length + node.children.reduce((sum, c) => sum + countDocsInSubtree(c), 0)
}

function FolderTreeView({
  nodes,
  depth,
  viewMode,
  renderDocItem,
  renderGridItem,
}: {
  nodes: FolderTreeNode[]
  depth: number
  viewMode: 'list' | 'grid'
  renderDocItem: (doc: Document) => React.ReactNode
  renderGridItem: (doc: Document) => React.ReactNode
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>()
    nodes.forEach((n) => {
      ids.add(n.category.id)
      n.children.forEach((c) => ids.add(c.category.id))
    })
    return ids
  })

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const isExpanded = expandedIds.has(node.category.id)
        const totalDocs = countDocsInSubtree(node)
        const hasChildren = node.children.length > 0
        const hasDocs = node.docs.length > 0

        return (
          <div key={node.category.id}>
            <button
              className={cn(
                'w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors',
                'hover:bg-accent/50',
                depth === 0 && 'bg-muted/30'
              )}
              style={{ paddingLeft: depth * 20 + 12 }}
              onClick={() => toggle(node.category.id)}
            >
              {hasChildren || hasDocs ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )
              ) : (
                <span className="w-4 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-5 w-5 text-primary/70 shrink-0" />
              ) : (
                <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm font-medium truncate">
                {node.category.name}
              </span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {totalDocs}개
              </span>
            </button>

            {isExpanded && (
              <div className="mt-1">
                {hasDocs && (
                  <div
                    style={{ paddingLeft: depth * 20 + 32 }}
                    className="pr-2"
                  >
                    {viewMode === 'list' ? (
                      <div className="space-y-1.5 mb-2">
                        {node.docs.map(renderDocItem)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-2">
                        {node.docs.map(renderGridItem)}
                      </div>
                    )}
                  </div>
                )}

                {hasChildren && (
                  <FolderTreeView
                    nodes={node.children}
                    depth={depth + 1}
                    viewMode={viewMode}
                    renderDocItem={renderDocItem}
                    renderGridItem={renderGridItem}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Memoized document item to prevent unnecessary re-renders
const DocListItem = memo(function DocListItem({
  doc,
  isBookmarked,
  onToggleBookmark,
  userEmail,
}: {
  doc: Document
  isBookmarked: boolean
  onToggleBookmark: (docId: string, e: React.MouseEvent) => void
  userEmail: string
}) {
  return (
    <Link
      href={`/documents/${doc.id}`}
      className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors"
    >
      <FileIcon
        fileName={doc.file_name}
        fileExtension={doc.file_extension}
        className="h-8 w-8 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{doc.title}</p>
          {doc.security_level === 'confidential' && (
            <Badge variant="destructive" className="shrink-0 text-xs">
              <Shield className="h-3 w-3 mr-1" />
              대외비
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {doc.file_name} · {doc.author_name} ·{' '}
          {formatDate(doc.created_at)}
          {doc.file_size && ` · ${formatFileSize(doc.file_size)}`}
        </p>
        {doc.tags && doc.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {doc.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => onToggleBookmark(doc.id, e)}
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-4 w-4 fill-current" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <a
            href={`/api/documents/${doc.id}/download?user_email=${encodeURIComponent(userEmail)}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </Link>
  )
})

const DocGridItem = memo(function DocGridItem({ doc }: { doc: Document }) {
  return (
    <Link
      href={`/documents/${doc.id}`}
      className="rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors flex flex-col"
    >
      <FileIcon
        fileName={doc.file_name}
        fileExtension={doc.file_extension}
        className="h-10 w-10 mb-3"
      />
      <p className="text-sm font-medium truncate">{doc.title}</p>
      <p className="text-xs text-muted-foreground truncate mt-1">
        {doc.file_name}
      </p>
      <p className="text-xs text-muted-foreground mt-auto pt-2">
        {formatDate(doc.created_at)}
      </p>
    </Link>
  )
})

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  const user = useUser()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [groupMode, setGroupMode] = useState<GroupMode>('all')

  // Paginated data for list/grid/date views
  const paginated = useDocumentsPaginated(user.email, categoryId)
  // Full data for folder tree view (only fetched when folder mode is active)
  const allDocs = useDocumentsAll(user.email, categoryId, groupMode === 'folder')

  const { bookmarkedIds, toggleBookmark } = useBookmarks(user.email)
  const { categories } = useCategories()

  // Pick the right data source based on group mode
  const documents = groupMode === 'folder'
    ? allDocs.documents
    : paginated.documents
  const total = groupMode === 'folder' ? allDocs.total : paginated.total
  const isLoading = groupMode === 'folder' ? allDocs.isLoading : paginated.isLoading

  // Folder tree (only computed in folder mode)
  const folderTree = useMemo(
    () => groupMode === 'folder' ? buildFolderTree(categories, documents) : [],
    [categories, documents, groupMode]
  )

  // Date groups (only computed in date mode)
  const groupedByDate = useMemo(() => {
    if (groupMode !== 'date') return null
    const groups: Record<string, Document[]> = {}
    documents.forEach((doc) => {
      const date = new Date(doc.created_at)
      const key = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
      if (!groups[key]) groups[key] = []
      groups[key].push(doc)
    })
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))
    return sortedKeys.map((key) => ({ label: key, docs: groups[key] }))
  }, [documents, groupMode])

  const renderDocItem = (doc: Document) => (
    <DocListItem
      key={doc.id}
      doc={doc}
      isBookmarked={bookmarkedIds.has(doc.id)}
      onToggleBookmark={toggleBookmark}
      userEmail={user.email}
    />
  )

  const renderGridItem = (doc: Document) => (
    <DocGridItem key={doc.id} doc={doc} />
  )

  return (
    <>
      <Header title="문서함" />
      <div className="flex-1 p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? '불러오는 중...' : `총 ${total}개 문서`}
          </p>
          <div className="flex gap-1">
            {/* Group mode */}
            <div className="flex gap-1 mr-2 border-r pr-2">
              <Button
                variant={groupMode === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setGroupMode('all')}
              >
                전체
              </Button>
              <Button
                variant={groupMode === 'folder' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setGroupMode('folder')}
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                폴더별
              </Button>
              <Button
                variant={groupMode === 'date' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setGroupMode('date')}
              >
                <Calendar className="h-4 w-4 mr-1" />
                날짜별
              </Button>
            </div>
            {/* View mode */}
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Document list */}
        {documents.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4" />
            <p>문서가 없습니다</p>
          </div>
        ) : groupMode === 'folder' ? (
          <FolderTreeView
            nodes={folderTree}
            depth={0}
            viewMode={viewMode}
            renderDocItem={renderDocItem}
            renderGridItem={renderGridItem}
          />
        ) : groupMode === 'date' && groupedByDate ? (
          <div className="space-y-6">
            {groupedByDate.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold tracking-tight">
                    {group.label}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    ({group.docs.length})
                  </span>
                </div>
                {viewMode === 'list' ? (
                  <div className="space-y-2">
                    {group.docs.map(renderDocItem)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {group.docs.map(renderGridItem)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {documents.map(renderDocItem)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {documents.map(renderGridItem)}
          </div>
        )}

        {/* Load more button (paginated views only) */}
        {groupMode !== 'folder' && paginated.hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={paginated.loadMore}
              disabled={paginated.isValidating}
              className="min-w-[200px]"
            >
              {paginated.isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  불러오는 중...
                </>
              ) : (
                `더 보기 (${documents.length}/${total})`
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
