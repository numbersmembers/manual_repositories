import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

// GET /api/documents/search?q=검색어&limit=20&user_email=xxx
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

    // Use the FTS search_documents() function (supports FTS + ILIKE fallback + tag filtering)
    const { data, error } = await supabase.rpc('search_documents', {
      search_query: q,
      user_role: userRole,
      result_limit: limit,
      result_offset: 0,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // search_documents returns tags as TEXT[] — keep as-is
    const results = (data || []).map((doc: Record<string, unknown>) => ({
      ...doc,
      tags: (doc.tags as string[]) || [],
    }))

    return NextResponse.json(results)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
