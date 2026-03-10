import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SearchCommand } from '@/components/layout/search-command'
import type { Category } from '@/lib/types'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  // Middleware already handles auth redirects.
  // Only redirect to signout (not /login) to avoid redirect loop.
  if (!user) redirect('/auth/signout')
  if (user.status === 'pending') redirect('/pending')
  if (user.status === 'banned') redirect('/auth/signout')

  const supabase = await createServiceClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
    .order('name')

  return (
    <SidebarProvider>
      <AppSidebar user={user} categories={(categories || []) as Category[]} />
      <SidebarInset>
        {children}
      </SidebarInset>
      <SearchCommand />
    </SidebarProvider>
  )
}
