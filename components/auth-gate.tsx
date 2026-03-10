'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProvider } from './user-provider'
import { SidebarProvider, SidebarInset } from './ui/sidebar'
import { AppSidebar } from './layout/app-sidebar'
import { SearchCommand } from './layout/search-command'
import type { User, Category } from '@/lib/types'

function getStoredEmail(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('mr_user_email')
}

export function AuthGate({
  serverUser,
  categories,
  children,
}: {
  serverUser: User | null
  categories: Category[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(serverUser)
  const [checking, setChecking] = useState(!serverUser)

  useEffect(() => {
    if (serverUser) return

    async function clientAuth() {
      try {
        // Read email from localStorage (set during OAuth callback)
        const email = getStoredEmail()

        if (!email) {
          router.replace('/login')
          return
        }

        const res = await fetch(
          `/api/users/me?email=${encodeURIComponent(email)}`
        )
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        } else {
          router.replace('/login')
        }
      } catch {
        router.replace('/login')
      } finally {
        setChecking(false)
      }
    }

    clientAuth()
  }, [serverUser, router])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!user) return null

  if (user.status === 'pending') {
    router.replace('/pending')
    return null
  }
  if (user.status === 'banned') {
    router.replace('/login')
    return null
  }

  return (
    <UserProvider user={user}>
      <SidebarProvider>
        <AppSidebar user={user} categories={categories} />
        <SidebarInset>{children}</SidebarInset>
        <SearchCommand />
      </SidebarProvider>
    </UserProvider>
  )
}
