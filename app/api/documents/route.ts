import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

// GET /api/documents?page=1&limit=50&category_id=xxx&user_email=xxx&fetchAll=true
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const fetchAll = searchParams.get('fetchAll') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '50')))
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

    const flattenTags = (doc: Record<string, unknown>) => {
      const docTags = (doc.document_tags as Array<{ tags: { name: string } | null }>) || []
      const tags = docTags
        .map((dt) => dt.tags?.name)
        .filter(Boolean)
      const { document_tags: _, ...rest } = doc
      return { ...rest, tags }
    }

    // Fetch all documents in batches (for folder tree view)
    if (fetchAll) {
      const BATCH_SIZE = 1000
      let allData: Record<string, unknown>[] = []
      let offset = 0
      let totalCount = 0

      while (true) {
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
          .range(offset, offset + BATCH_SIZE - 1)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (offset === 0 && count !== null) {
          totalCount = count
        }

        allData = [...allData, ...(data || [])]

        if (!data || data.length < BATCH_SIZE) break
        offset += BATCH_SIZE
      }

      const documents = allData.map(flattenTags)
      return NextResponse.json({ documents, total: totalCount, hasMore: false })
    }

    // Paginated fetch (for list/grid/date views)
    let query = supabase
      .from('documents')
      .select('*, document_tags(tag_id, tags(name))', { count: 'exact' })

    if (userRole !== 'admin') {
      query = query.eq('security_level', 'general')
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const offset = (page - 1) * limit
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const documents = (data || []).map(flattenTags)

    const total = count ?? 0
    const hasMore = offset + documents.length < total

    return NextResponse.json({ documents, total, page, limit, hasMore })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
