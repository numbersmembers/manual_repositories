import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityAction } from './types'

export async function logActivity(
  supabase: SupabaseClient,
  params: {
    userId: string
    userEmail: string
    userName: string
    action: ActivityAction
    targetType?: 'document' | 'category' | 'user'
    targetId?: string
    targetName?: string
    metadata?: Record<string, unknown>
  }
) {
  const { error } = await supabase.from('activity_logs').insert({
    user_id: params.userId,
    user_email: params.userEmail,
    user_name: params.userName,
    action: params.action,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    target_name: params.targetName ?? null,
    metadata: params.metadata ?? {},
  })

  if (error) {
    console.error('Failed to log activity:', error)
  }
}
