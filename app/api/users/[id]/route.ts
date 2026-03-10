import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

// PATCH /api/users/[id] - 사용자 상태/역할 변경 (관리자 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    const { id } = await params
    const body = await request.json()
    const { status, role } = body

    const supabase = createServiceClient()

    const updateData: Record<string, string> = {}
    if (status) updateData.status = status
    if (role) updateData.role = role

    const { data: targetUser } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 활동 로그
    if (user) {
      if (status === 'active') {
        await logActivity(supabase, {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          action: 'approve_user',
          targetType: 'user',
          targetId: id,
          targetName: targetUser?.name,
        })
      } else if (status === 'banned') {
        await logActivity(supabase, {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          action: 'ban_user',
          targetType: 'user',
          targetId: id,
          targetName: targetUser?.name,
        })
      }

      if (role) {
        await logActivity(supabase, {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          action: 'change_role',
          targetType: 'user',
          targetId: id,
          targetName: targetUser?.name,
          metadata: { newRole: role },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
