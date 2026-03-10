import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

// GET /api/bookmarks - 내 북마크 목록
export async function GET(request: NextRequest) {
  try {
    let user = await getAuthUser()

    // Fallback: look up user by email if cookie auth fails
    const userEmail = request.nextUrl.searchParams.get('user_email')
    if (!user && userEmail) {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single()
      user = data
    }

    if (!user) {
      return NextResponse.json([], { status: 200 })
    }

    const supabase = createServiceClient()

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
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/bookmarks - 북마크 추가/토글
export async function POST(request: NextRequest) {
  try {
    let user = await getAuthUser()
    const body = await request.json()
    const { document_id, user_email } = body

    // Fallback: look up user by email if cookie auth fails
    if (!user && user_email) {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', user_email)
        .single()
      user = data
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    if (!document_id) {
      return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

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
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
