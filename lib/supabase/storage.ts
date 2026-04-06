import type { SupabaseClient } from '@supabase/supabase-js'
import { STORAGE_BUCKET } from '../constants'

// Resolve reliable content type for upload (browsers may return empty string for ZIP, HWP, etc.)
function resolveContentType(file: File): string {
  if (file.type && file.type !== '') return file.type

  const ext = file.name.split('.').pop()?.toLowerCase()
  const extMap: Record<string, string> = {
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    hwp: 'application/x-hwp',
    hwpx: 'application/hwp+zip',
    doc: 'application/msword',
    xls: 'application/vnd.ms-excel',
    ppt: 'application/vnd.ms-powerpoint',
    pdf: 'application/pdf',
  }
  return ext ? (extMap[ext] ?? 'application/octet-stream') : 'application/octet-stream'
}

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
      contentType: resolveContentType(file),
    })

  if (error) {
    return { path: '', error: error.message }
  }

  return { path: data.path, error: null }
}

export async function getSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn: number = 300,
  downloadFileName?: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn, {
      download: downloadFileName || false,
    })

  if (error) {
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
  // Supabase Storage only allows ASCII characters in keys
  const safeCategoryPath = categoryPath
    .replace(/[^a-zA-Z0-9/_-]/g, '_')
    .replace(/_+/g, '_')
  const ext = fileName.includes('.') ? fileName.split('.').pop() : ''
  const safeName = fileName
    .replace(/\.[^.]+$/, '') // remove extension
    .replace(/[^a-zA-Z0-9._-]/g, '_') // only ASCII safe chars
    .replace(/_+/g, '_') // collapse multiple underscores
    .slice(0, 50) // limit length
  return `${safeCategoryPath}/${fileId}_${safeName}${ext ? `.${ext}` : ''}`
}
