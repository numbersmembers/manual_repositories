import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

// GET /api/bookmarks - 내 북마크 목록
export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('bookmarks')
      .select('*, documents(id, title, file_name, file_type, file_extension, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}

// POST /api/bookmarks - 북마크 추가/토글
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { document_id } = body

    if (!document_id) {
      return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // 이미 북마크되어 있으면 삭제 (토글)
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('document_id', document_id)
      .single()

    if (existing) {
      await supabase.from('bookmarks').delete().eq('id', existing.id)
      return NextResponse.json({ bookmarked: false })
    }

    // 새 북마크 추가
    const { error } = await supabase.from('bookmarks').insert({
      user_id: user.id,
      document_id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookmarked: true }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}
