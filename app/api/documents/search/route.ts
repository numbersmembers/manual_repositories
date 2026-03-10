import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

// GET /api/documents/search?q=검색어&category_id=xxx&tags=tag1,tag2
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const categoryId = searchParams.get('category_id') || null
    const tagsParam = searchParams.get('tags')
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServiceClient()

    // PostgreSQL FTS 함수 호출
    const { data, error } = await supabase.rpc('search_documents', {
      search_query: q || null,
      user_role: user?.role ?? 'staff',
      category_filter: categoryId,
      tag_filters: tags,
      result_limit: limit,
      result_offset: offset,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
