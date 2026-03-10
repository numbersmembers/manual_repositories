import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSignedUrl } from '@/lib/supabase/storage'

// GET /api/documents/[id]/view - inline preview (no Content-Disposition: attachment)
export async function GET(
  _request: NextRequest,
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
