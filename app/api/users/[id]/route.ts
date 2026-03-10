import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

// PATCH /api/users/[id] - 사용자 상태/역할 변경 (관리자 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const { status, role } = body

    const supabase = await createServiceClient()

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
    if (status === 'active') {
      await logActivity(supabase, {
        userId: admin.id,
        userEmail: admin.email,
        userName: admin.name,
        action: 'approve_user',
        targetType: 'user',
        targetId: id,
        targetName: targetUser?.name,
      })
    } else if (status === 'banned') {
      await logActivity(supabase, {
        userId: admin.id,
        userEmail: admin.email,
        userName: admin.name,
        action: 'ban_user',
        targetType: 'user',
        targetId: id,
        targetName: targetUser?.name,
      })
    }

    if (role) {
      await logActivity(supabase, {
        userId: admin.id,
        userEmail: admin.email,
        userName: admin.name,
        action: 'change_role',
        targetType: 'user',
        targetId: id,
        targetName: targetUser?.name,
        metadata: { newRole: role },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}
