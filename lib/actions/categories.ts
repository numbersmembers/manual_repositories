'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createCategory(name: string, parentId: string | null) {
  const admin = await requireAdmin()
  const supabase = await createServiceClient()

  let path = name
  if (parentId) {
    const { data: parent } = await supabase
      .from('categories')
      .select('path')
      .eq('id', parentId)
      .single()

    if (parent) {
      path = `${parent.path}/${name}`
    }
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, parent_id: parentId, path, sort_order: 0 })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  await supabase.from('activity_logs').insert({
    user_id: admin.id,
    user_email: admin.email,
    user_name: admin.name,
    action: 'create_folder',
    target_type: 'category',
    target_id: data.id,
    target_name: name,
    metadata: {},
  })

  revalidatePath('/admin/categories')
  return { data }
}

export async function deleteCategory(id: string) {
  await requireAdmin()
  const supabase = await createServiceClient()

  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function getCategories() {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    return []
  }

  return data
}
