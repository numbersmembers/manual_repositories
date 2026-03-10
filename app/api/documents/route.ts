import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

// GET /api/documents?category_id=xxx - 문서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const supabase = createServiceClient()

    // Resolve user role (fallback to email lookup for Vercel production)
    let userRole = user?.role || 'staff'
    if (!user) {
      const email = searchParams.get('user_email')
      if (email) {
        const { data: u } = await supabase
          .from('users')
          .select('role')
          .eq('email', email)
          .single()
        if (u) userRole = u.role
      }
    }

    let query = supabase
      .from('documents')
      .select('*, document_tags(tag_id, tags(name))', { count: 'exact' })

    // Staff can only see general documents
    if (userRole !== 'admin') {
      query = query.eq('security_level', 'general')
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 태그 이름 평탄화
    const documents = (data || []).map((doc) => {
      const tags = (doc.document_tags || [])
        .map((dt: { tags: { name: string } | null }) => dt.tags?.name)
        .filter(Boolean)
      const { document_tags: _, ...rest } = doc
      return { ...rest, tags }
    })

    return NextResponse.json({
      documents,
      total: count ?? 0,
      page,
      limit,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
