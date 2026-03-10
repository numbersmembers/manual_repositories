import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import { deleteFile } from '@/lib/supabase/storage'

// GET /api/documents/[id] - 문서 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('documents')
      .select('*, document_tags(tag_id, tags(name))')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 보안등급 체크
    if (user.role !== 'admin' && data.security_level === 'confidential') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const tags = (data.document_tags || [])
      .map((dt: { tags: { name: string } | null }) => dt.tags?.name)
      .filter(Boolean)
    const { document_tags: _, ...rest } = data

    // 열람 로그
    await logActivity(supabase, {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'view',
      targetType: 'document',
      targetId: id,
      targetName: data.title,
    })

    return NextResponse.json({ ...rest, tags })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}

// DELETE /api/documents/[id] - 문서 삭제 (관리자 전용)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const supabase = await createServiceClient()

    // 먼저 문서 정보 조회
    const { data: doc } = await supabase
      .from('documents')
      .select('title, storage_path')
      .eq('id', id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Storage에서 파일 삭제
    await deleteFile(supabase, doc.storage_path)

    // DB에서 문서 삭제 (CASCADE로 tags, bookmarks, comments도 삭제됨)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logActivity(supabase, {
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: 'delete',
      targetType: 'document',
      targetId: id,
      targetName: doc.title,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}
