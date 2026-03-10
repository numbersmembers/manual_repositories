import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

// GET /api/documents/search?q=검색어&limit=10&user_email=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!q) {
      return NextResponse.json([])
    }

    const supabase = createServiceClient()

    // Resolve user role for security filtering
    let userRole = 'staff'
    const user = await getAuthUser()
    if (user) {
      userRole = user.role
    } else {
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

    // Search documents by title, file_name, author_name using ILIKE
    const pattern = `%${q}%`
    let query = supabase
      .from('documents')
      .select('*, document_tags(tag_id, tags(name))')
      .or(`title.ilike.${pattern},file_name.ilike.${pattern},author_name.ilike.${pattern}`)

    // Staff can only see general documents
    if (userRole !== 'admin') {
      query = query.eq('security_level', 'general')
    }

    const { data: docs, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also search by tag name (with flexible space matching)
    const noSpaceQ = q.replace(/\s+/g, '')
    const noSpacePattern = `%${noSpaceQ}%`
    const { data: allTags } = await supabase
      .from('tags')
      .select('id, name')

    // Match tags where name contains query OR name without spaces contains query without spaces
    const tagMatches = (allTags || []).filter((t) => {
      const lower = t.name.toLowerCase()
      const noSpaceName = lower.replace(/\s+/g, '')
      return lower.includes(q.toLowerCase()) || noSpaceName.includes(noSpaceQ.toLowerCase())
    })

    let tagDocIds: string[] = []
    if (tagMatches && tagMatches.length > 0) {
      const tagIds = tagMatches.map((t) => t.id)
      const { data: docTags } = await supabase
        .from('document_tags')
        .select('document_id')
        .in('tag_id', tagIds)

      if (docTags) {
        tagDocIds = docTags.map((dt) => dt.document_id)
      }
    }

    // Fetch tag-matched documents not already in results
    const existingIds = new Set((docs || []).map((d) => d.id))
    const missingTagDocIds = tagDocIds.filter((id) => !existingIds.has(id))

    let tagDocs: typeof docs = []
    if (missingTagDocIds.length > 0) {
      let tagQuery = supabase
        .from('documents')
        .select('*, document_tags(tag_id, tags(name))')
        .in('id', missingTagDocIds)
      if (userRole !== 'admin') {
        tagQuery = tagQuery.eq('security_level', 'general')
      }
      const { data } = await tagQuery
        .order('created_at', { ascending: false })
        .limit(limit)
      tagDocs = data || []
    }

    // Merge and flatten tags
    const allDocs = [...(docs || []), ...tagDocs]
    const results = allDocs.map((doc) => {
      const tags = (doc.document_tags || [])
        .map((dt: { tags: { name: string } | null }) => dt.tags?.name)
        .filter(Boolean)
      const { document_tags: _, ...rest } = doc
      return { ...rest, tags }
    })

    return NextResponse.json(results.slice(0, limit))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
