import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

// GET /api/categories - 카테고리 트리 조회
export async function GET() {
  try {
    await requireAuth()
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}

// POST /api/categories - 카테고리 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()
    const { name, parent_id, sort_order } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // path 생성: 부모가 있으면 부모 경로에 추가
    let path = name
    if (parent_id) {
      const { data: parent } = await supabase
        .from('categories')
        .select('path')
        .eq('id', parent_id)
        .single()

      if (parent) {
        path = `${parent.path}/${name}`
      }
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        parent_id: parent_id || null,
        path,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logActivity(supabase, {
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: 'create_folder',
      targetType: 'category',
      targetId: data.id,
      targetName: name,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}
