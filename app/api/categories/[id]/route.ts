import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

// PATCH /api/categories/[id] - 카테고리 수정 (관리자 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const { name, parent_id, sort_order } = body

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (parent_id !== undefined) updateData.parent_id = parent_id || null
    if (sort_order !== undefined) updateData.sort_order = sort_order

    // path 재생성
    if (name || parent_id !== undefined) {
      const catName = name
      if (parent_id) {
        const { data: parent } = await supabase
          .from('categories')
          .select('path')
          .eq('id', parent_id)
          .single()

        if (parent && catName) {
          updateData.path = `${parent.path}/${catName}`
        }
      } else if (catName) {
        updateData.path = catName
      }
    }

    const { error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}

// DELETE /api/categories/[id] - 카테고리 삭제 (관리자 전용, CASCADE)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const supabase = await createClient()

    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logActivity(supabase, {
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: 'delete_folder',
      targetType: 'category',
      targetId: id,
      targetName: category?.name,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}
