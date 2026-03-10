import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import { uploadFile, generateStoragePath } from '@/lib/supabase/storage'
import { getFileExtension } from '@/lib/utils'

// POST /api/upload - 파일 업로드
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const categoryId = formData.get('category_id') as string
    const securityLevel = (formData.get('security_level') as string) || 'general'
    const tagsJson = formData.get('tags') as string
    const userEmail = formData.get('user_email') as string

    if (!file || !title || !categoryId) {
      return NextResponse.json(
        { error: 'file, title, category_id are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Look up user from DB by email (cookies not available in production)
    let dbUser = user
    if (!dbUser && userEmail) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single()
      dbUser = data
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found. Please sign in again.' },
        { status: 401 }
      )
    }

    // 카테고리 경로 조회
    const { data: category } = await supabase
      .from('categories')
      .select('path')
      .eq('id', categoryId)
      .single()

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // 파일 정보
    const fileExtension = getFileExtension(file.name)
    const fileType = file.type || 'application/octet-stream'

    // 임시 ID 생성 (UUID 형태)
    const fileId = crypto.randomUUID()
    const storagePath = generateStoragePath(category.path, fileId, file.name)

    // Supabase Storage에 업로드
    const { error: uploadError } = await uploadFile(supabase, file, storagePath)
    if (uploadError) {
      return NextResponse.json({ error: uploadError }, { status: 500 })
    }

    // DB에 문서 레코드 생성
    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        id: fileId,
        title,
        file_name: file.name,
        file_type: fileType,
        file_extension: fileExtension,
        storage_path: storagePath,
        file_size: file.size,
        security_level: securityLevel,
        category_id: categoryId,
        author_id: dbUser.id,
        author_name: dbUser.name ?? 'Unknown',
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // 태그 처리
    if (tagsJson) {
      try {
        const tagNames: string[] = JSON.parse(tagsJson)
        for (const tagName of tagNames) {
          // upsert 태그
          const { data: tag } = await supabase
            .from('tags')
            .upsert({ name: tagName.trim() }, { onConflict: 'name' })
            .select('id')
            .single()

          if (tag) {
            await supabase.from('document_tags').insert({
              document_id: doc.id,
              tag_id: tag.id,
            })
          }
        }
      } catch {
        // 태그 파싱 실패 무시
      }
    }

    // 활동 로그
    if (dbUser) {
      await logActivity(supabase, {
        userId: dbUser.id,
        userEmail: dbUser.email,
        userName: dbUser.name,
        action: 'upload',
        targetType: 'document',
        targetId: doc.id,
        targetName: title,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType,
        },
      })
    }

    return NextResponse.json(doc, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
