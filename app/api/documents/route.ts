import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

// GET /api/documents?category_id=xxx - 문서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
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

    // Fetch all documents using paginated queries (Supabase max 1000 per request)
    const PAGE_SIZE = 1000
    let allData: Record<string, unknown>[] = []
    let totalCount = 0
    let offset = 0
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('documents')
        .select('*, document_tags(tag_id, tags(name))', { count: 'exact' })

      if (userRole !== 'admin') {
        query = query.eq('security_level', 'general')
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (count !== null && offset === 0) {
        totalCount = count
      }

      allData = [...allData, ...(data || [])]
      hasMore = (data?.length ?? 0) === PAGE_SIZE
      offset += PAGE_SIZE
    }

    // 태그 이름 평탄화
    const documents = allData.map((doc) => {
      const docTags = (doc.document_tags as Array<{ tags: { name: string } | null }>) || []
      const tags = docTags
        .map((dt) => dt.tags?.name)
        .filter(Boolean)
      const { document_tags: _, ...rest } = doc
      return { ...rest, tags }
    })

    return NextResponse.json({
      documents,
      total: totalCount,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
