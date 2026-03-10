import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { User } from './types'

export async function getAuthUser(): Promise<User | null> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser?.email) return null

  const serviceClient = await createServiceClient()
  const { data: dbUser, error: dbError } = await serviceClient
    .from('users')
    .select('*')
    .eq('email', authUser.email)
    .single()

  if (dbError) {
    throw new Error(`DB error: ${dbError.message}`)
  }

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
