import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-log'

// PATCH /api/categories/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, parent_id, sort_order } = body

    const supabase = createServiceClient()

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (parent_id !== undefined) updateData.parent_id = parent_id || null
    if (sort_order !== undefined) updateData.sort_order = sort_order

    if (name || parent_id !== undefined) {
      const catName = name
      if (parent_id) {
        const { data: parent } = await supabase
          .from('categories')
          .select('path')
          .eq('id', parent_id)
          .single()

        if (parent && catName) {
          updateData.path = `${parent.path}/${catName}`
        }
      } else if (catName) {
        updateData.path = catName
      }
    }

    const { error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity if user_email provided in query
    const userEmail = request.nextUrl.searchParams.get('user_email')
    if (userEmail) {
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', userEmail)
        .single()

      if (user) {
        await logActivity(supabase, {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          action: 'delete_folder',
          targetType: 'category',
          targetId: id,
          targetName: category?.name,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
