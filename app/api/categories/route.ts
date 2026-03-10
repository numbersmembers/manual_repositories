import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-log'
import type { User } from '@/lib/types'

// Get admin user with fallback for production cookie issues
async function getAdmin(): Promise<User> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const email = session?.user?.email
  if (!email) throw new Error('Unauthorized')

  const serviceClient = createServiceClient()
  const { data: user } = await serviceClient
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (!user) throw new Error('Unauthorized')
  if (user.status !== 'active') throw new Error('Forbidden')
  if (user.role !== 'admin') throw new Error('Forbidden: Admin required')
  return user as User
}

// GET /api/categories - 카테고리 트리 조회
// Auth is handled by layout — service client bypasses RLS
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

// POST /api/categories - 카테고리 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin()
    const body = await request.json()
    const { name, sort_order } = body
    const parentId = body.parent_id && body.parent_id !== 'none' ? body.parent_id : null

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // path 생성: 부모가 있으면 부모 경로에 추가
    let path = name
    if (parentId) {
      const { data: parent } = await supabase
        .from('categories')
        .select('path')
        .eq('id', parentId)
        .single()

      if (parent) {
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
