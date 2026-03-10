import { getAuthUser } from '@/lib/auth'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AuthRedirect } from '@/components/auth-redirect'
import { UserProvider } from '@/components/user-provider'
import { AuthGate } from '@/components/auth-gate'

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

  // Server auth failed — use client-side auth fallback
  if (!user) {
    return (
      <AuthGate serverUser={null}>
        {children}
      </AuthGate>
    )
  }

  if (user.status === 'pending') return <AuthRedirect to="/pending" />
  if (user.status === 'banned') return <AuthRedirect to="/auth/signout" />

  return (
    <UserProvider user={user}>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </UserProvider>
  )
}
