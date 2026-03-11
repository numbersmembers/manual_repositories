import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-log'

// GET /api/categories
export async function GET() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, sort_order } = body
    const parentId = body.parent_id && body.parent_id !== 'none' ? body.parent_id : null

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    let path = name
    if (parentId) {
      const { data: parent } = await supabase
        .from('categories')
        .select('path')
        .eq('id', parentId)
        .single()

      if (parent) {
        // 10-level hierarchy check: root(0) + 9 sub-levels = max 9 slashes
        const parentDepth = parent.path.split('/').length
        if (parentDepth >= 10) {
          return NextResponse.json(
            { error: '최대 10단계까지만 폴더를 생성할 수 있습니다.' },
            { status: 400 }
          )
        }
        path = `${parent.path}/${name}`
      }
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        parent_id: parentId,
        path,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity if user email provided
    if (body.user_email) {
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', body.user_email)
        .single()

      if (user) {
        await logActivity(supabase, {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          action: 'create_folder',
          targetType: 'category',
          targetId: data.id,
          targetName: name,
        })
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
