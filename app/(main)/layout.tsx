import { getAuthUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SearchCommand } from '@/components/layout/search-command'
import { AuthRedirect } from '@/components/auth-redirect'
import { UserProvider } from '@/components/user-provider'
import { AuthGate } from '@/components/auth-gate'
import type { Category } from '@/lib/types'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  try {
    user = await getAuthUser()
  } catch {
    // Server auth failed — will fallback to client auth
  }

  let categories: Category[] = []
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .order('name')
    categories = (data || []) as Category[]
  } catch {
    // DB query failure should not crash the layout
  }

  // Server auth failed — use client-side auth fallback
  if (!user) {
    return (
      <AuthGate serverUser={null} categories={categories}>
        {children}
      </AuthGate>
    )
  }

  if (user.status === 'pending') return <AuthRedirect to="/pending" />
  if (user.status === 'banned') return <AuthRedirect to="/auth/signout" />

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
