import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

// PATCH /api/documents/[id]/move - 문서 카테고리 이동 (관리자 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    const { id } = await params
    const body = await request.json()
    const { category_id } = body

    if (!category_id) {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: doc } = await supabase
      .from('documents')
      .select('title')
      .eq('id', id)
      .single()

    const { data: newCat } = await supabase
      .from('categories')
      .select('name')
      .eq('id', category_id)
      .single()

    const { error } = await supabase
      .from('documents')
      .update({ category_id })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (user) {
      await logActivity(supabase, {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: 'move',
        targetType: 'document',
        targetId: id,
        targetName: doc?.title,
        metadata: { newCategory: newCat?.name, newCategoryId: category_id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
