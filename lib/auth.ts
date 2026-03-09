import { createClient } from '@/lib/supabase/server'
import type { User } from './types'

export async function getAuthUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.email) return null

  const { data: dbUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', authUser.email)
    .single()

  return dbUser ?? null
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
