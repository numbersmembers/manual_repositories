import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import { deleteFile } from '@/lib/supabase/storage'

// GET /api/documents/[id] - 문서 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    const { id } = await params
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('documents')
      .select('*, document_tags(tag_id, tags(name))')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 보안등급 체크
    if (user?.role !== 'admin' && data.security_level === 'confidential') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const tags = (data.document_tags || [])
      .map((dt: { tags: { name: string } | null }) => dt.tags?.name)
      .filter(Boolean)
    const { document_tags: _, ...rest } = data

    // 열람 로그
    if (user) {
      await logActivity(supabase, {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: 'view',
        targetType: 'document',
        targetId: id,
        targetName: data.title,
      })
    }

    return NextResponse.json({ ...rest, tags })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH /api/documents/[id] - 보안등급 변경 (관리자 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { security_level, user_email } = body

    // Resolve admin user (with email fallback for Vercel production)
    let adminUser = await getAuthUser()
    if (!adminUser && user_email) {
      const sb = createServiceClient()
      const { data: u } = await sb
        .from('users')
        .select('id, email, name, role')
        .eq('email', user_email)
        .single()
      if (u) adminUser = u
    }

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    if (!security_level || !['general', 'confidential'].includes(security_level)) {
      return NextResponse.json({ error: 'Invalid security_level' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: doc } = await supabase
      .from('documents')
      .select('title, security_level')
      .eq('id', id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('documents')
      .update({ security_level })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logActivity(supabase, {
      userId: adminUser.id,
      userEmail: adminUser.email,
      userName: adminUser.name,
      action: 'change_security',
      targetType: 'document',
      targetId: id,
      targetName: doc.title,
      metadata: { from: doc.security_level, to: security_level },
    })

    return NextResponse.json({ success: true, security_level })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/documents/[id] - 문서 삭제 (관리자 전용)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    const { id } = await params
    const supabase = createServiceClient()

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

    if (user) {
      await logActivity(supabase, {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: 'delete',
        targetType: 'document',
        targetId: id,
        targetName: doc.title,
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
