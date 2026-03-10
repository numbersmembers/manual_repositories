import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-log'
import type { User } from '@/lib/types'

function createAuthClientFromRequest(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )
}

async function getAdminFromRequest(request: NextRequest): Promise<User> {
  const supabase = createAuthClientFromRequest(request)
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const email = authUser?.email
  if (!email) throw new Error('Unauthorized')

  const serviceClient = createServiceClient()
  const { data: user } = await serviceClient
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (!user) throw new Error('Unauthorized')
  if (user.status !== 'active') throw new Error('Forbidden')
  if (user.role !== 'admin') throw new Error('Forbidden: Admin required')
  return user as User
}

// PATCH /api/categories/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAdminFromRequest(request)
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
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}

// DELETE /api/categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request)
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

    await logActivity(supabase, {
      userId: admin.id,
      userEmail: admin.email,
      userName: admin.name,
      action: 'delete_folder',
      targetType: 'category',
      targetId: id,
      targetName: category?.name,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 403 })
  }
}
