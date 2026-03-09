'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  FolderOpen,
  Upload,
  Bookmark,
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
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User, Category } from '@/lib/types'
import { CategoryTree } from './category-tree'
import { cn } from '@/lib/utils'

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

function NavItem({
  href,
  icon: Icon,
  title,
  isActive,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  isActive: boolean
}) {
  return (
    <SidebarMenuItem>
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
          'border border-transparent',
          isActive
            ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border hover:shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="tracking-tight">{title}</span>
      </Link>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ user, categories }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]">
            MR
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">Manual Repo</span>
            <span className="text-[11px] text-muted-foreground">Bloter/Numbers</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* 검색 */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <button
                  onClick={() => {
                    document.dispatchEvent(
                      new KeyboardEvent('keydown', { key: 'k', metaKey: true })
                    )
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-accent/50 px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                >
                  <Search className="h-4 w-4" />
                  <span>검색</span>
                  <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                    ⌘K
                  </kbd>
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* 메인 네비게이션 */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            워크스페이스
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNav.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  isActive={pathname === item.href}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* 폴더 트리 */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            폴더
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <CategoryTree categories={categories} currentPath={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 관리자 메뉴 */}
        {user.role === 'admin' && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                관리자
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {adminNav.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      title={item.title}
                      isActive={pathname.startsWith(item.href)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-accent/30 px-3 py-2.5">
          <Avatar className="h-8 w-8 shadow-sm">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold tracking-tight truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
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
