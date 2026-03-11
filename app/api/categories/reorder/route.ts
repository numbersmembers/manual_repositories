import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// PATCH /api/categories/reorder - Batch update sort_order
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body as { items: { id: string; sort_order: number }[] }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const updates = items.map(({ id, sort_order }) =>
      supabase
        .from('categories')
        .update({ sort_order })
        .eq('id', id)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
