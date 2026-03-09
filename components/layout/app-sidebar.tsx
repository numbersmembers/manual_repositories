'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  FolderOpen,
  Upload,
  Bookmark,
  Settings,
  Users,
  Activity,
  FolderTree,
  LogOut,
  Search,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User, Category } from '@/lib/types'
import { CategoryTree } from './category-tree'

interface AppSidebarProps {
  user: User
  categories: Category[]
}

const mainNav = [
  { title: '홈', href: '/', icon: Home },
  { title: '문서함', href: '/documents', icon: FolderOpen },
  { title: '업로드', href: '/upload', icon: Upload },
  { title: '북마크', href: '/bookmarks', icon: Bookmark },
]

const adminNav = [
  { title: '사용자 관리', href: '/admin/users', icon: Users },
  { title: '카테고리 관리', href: '/admin/categories', icon: FolderTree },
  { title: '활동 로그', href: '/admin/logs', icon: Activity },
]

export function AppSidebar({ user, categories }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm">
            MR
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">Manual Repo</span>
            <span className="text-xs text-muted-foreground">Bloter/Numbers</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* 검색 */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="text-muted-foreground"
                  id="search-trigger"
                >
                  <button
                    onClick={() => {
                      document.dispatchEvent(
                        new KeyboardEvent('keydown', { key: 'k', metaKey: true })
                      )
                    }}
                  >
                    <Search className="h-4 w-4" />
                    <span>검색</span>
                    <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                      ⌘K
                    </kbd>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* 메인 네비게이션 */}
        <SidebarGroup>
          <SidebarGroupLabel>워크스페이스</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* 폴더 트리 */}
        <SidebarGroup>
          <SidebarGroupLabel>폴더</SidebarGroupLabel>
          <SidebarGroupContent>
            <CategoryTree categories={categories} currentPath={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 관리자 메뉴 */}
        {user.role === 'admin' && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>관리자</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Link
            href="/auth/signout"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
