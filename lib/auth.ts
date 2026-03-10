import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { User } from './types'

export async function getAuthUser(): Promise<User | null> {
  try {
    // Try Supabase session first
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let email = session?.user?.email ?? null

    // Fallback: read our custom cookie
    if (!email) {
      const cookieStore = await cookies()
      email = cookieStore.get('mr_user_email')?.value ?? null
    }

    if (!email) return null

    const serviceClient = createServiceClient()
    const { data: dbUser } = await serviceClient
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    return dbUser ?? null
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')
  if (user.status !== 'active') throw new Error('Forbidden')
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'admin') throw new Error('Forbidden: Admin required')
  return user
}
