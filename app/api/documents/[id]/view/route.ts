import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { getSignedUrl } from '@/lib/supabase/storage'

// GET /api/documents/[id]/view - inline preview (no Content-Disposition: attachment)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { data: doc } = await supabase
      .from('documents')
      .select('storage_path, security_level')
      .eq('id', id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Security check
    let userRole = 'staff'
    const user = await getAuthUser()
    if (user) {
      userRole = user.role
    } else {
      const email = request.nextUrl.searchParams.get('user_email')
      if (email) {
        const { data: u } = await supabase
          .from('users')
          .select('role')
          .eq('email', email)
          .single()
        if (u) userRole = u.role
      }
    }

    if (userRole !== 'admin' && doc.security_level === 'confidential') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const signedUrl = await getSignedUrl(supabase, doc.storage_path, 300)
    if (!signedUrl) {
      return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
    }

    return NextResponse.redirect(signedUrl)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
