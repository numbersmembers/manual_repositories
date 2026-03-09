import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import { getSignedUrl } from '@/lib/supabase/storage'

// GET /api/documents/[id]/download - 문서 다운로드 (signed URL 리다이렉트)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    const { data: doc } = await supabase
      .from('documents')
      .select('title, storage_path, security_level')
      .eq('id', id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 보안등급 체크
    if (user.role !== 'admin' && doc.security_level === 'confidential') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const signedUrl = await getSignedUrl(supabase, doc.storage_path, 60)
    if (!signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    // 다운로드 로그
    await logActivity(supabase, {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'download',
      targetType: 'document',
      targetId: id,
      targetName: doc.title,
    })

    return NextResponse.redirect(signedUrl)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}
