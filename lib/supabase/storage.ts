import type { SupabaseClient } from '@supabase/supabase-js'
import { STORAGE_BUCKET } from '../constants'

export async function uploadFile(
  supabase: SupabaseClient,
  file: File,
  storagePath: string
): Promise<{ path: string; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { path: '', error: error.message }
  }

  return { path: data.path, error: null }
}

export async function getSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn: number = 300
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn)

  if (error) {
    console.error('Failed to create signed URL:', error)
    return null
  }

  return data.signedUrl
}

export async function deleteFile(
  supabase: SupabaseClient,
  storagePath: string
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath])

  if (error) {
    console.error('Failed to delete file:', error)
    return false
  }

  return true
}

export function generateStoragePath(
  categoryPath: string,
  fileId: string,
  fileName: string
): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
  return `${categoryPath}/${fileId}_${sanitized}`
}
