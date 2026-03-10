import { getAuthUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SearchCommand } from '@/components/layout/search-command'
import { AuthRedirect } from '@/components/auth-redirect'
import { UserProvider } from '@/components/user-provider'
import type { Category } from '@/lib/types'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  // Middleware handles session-level redirect to /login.
  // Here we handle edge cases with client-side redirect to avoid
  // server-side redirect errors during RSC streaming.
  if (!user) return <AuthRedirect to="/auth/signout" />
  if (user.status === 'pending') return <AuthRedirect to="/pending" />
  if (user.status === 'banned') return <AuthRedirect to="/auth/signout" />

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

  return (
    <UserProvider user={user}>
      <SidebarProvider>
        <AppSidebar user={user} categories={categories} />
        <SidebarInset>
          {children}
        </SidebarInset>
        <SearchCommand />
      </SidebarProvider>
    </UserProvider>
  )
}
