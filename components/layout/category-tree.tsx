'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar'
import type { Category } from '@/lib/types'

interface CategoryTreeProps {
  categories: Category[]
  currentPath: string
}

function buildTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>()
  const roots: Category[] = []

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] })
  })

  categories.forEach((cat) => {
    const node = map.get(cat.id)!
    if (cat.parent_id) {
      const parent = map.get(cat.parent_id)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

function CategoryNode({
  category,
  currentPath,
  level = 0,
}: {
  category: Category
  currentPath: string
  level?: number
}) {
  const [open, setOpen] = useState(false)
  const hasChildren = category.children && category.children.length > 0
  const href = `/documents?category=${category.id}`
  const isActive = currentPath.includes(`category=${category.id}`)

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} className="text-sm">
          <Link href={href}>
            <Folder className="h-4 w-4" />
            <span>{category.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} className="text-sm">
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform',
                open && 'rotate-90'
              )}
            />
            {open ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )}
            <span>{category.name}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {category.children!.map((child) => (
              <CategoryNode
                key={child.id}
                category={child}
                currentPath={currentPath}
                level={level + 1}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

export function CategoryTree({ categories, currentPath }: CategoryTreeProps) {
  const tree = buildTree(categories)

  if (tree.length === 0) {
    return (
      <div className="px-4 py-2 text-xs text-muted-foreground">
        폴더가 없습니다
      </div>
    )
  }

  return (
    <SidebarMenu>
      {tree.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          currentPath={currentPath}
        />
      ))}
    </SidebarMenu>
  )
}
