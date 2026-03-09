'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from './theme-toggle'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-5">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      {title && <h1 className="text-base font-black tracking-tight">{title}</h1>}
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
