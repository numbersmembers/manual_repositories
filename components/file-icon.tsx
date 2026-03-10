import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileType,
  File,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  Presentation,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, { icon: typeof FileText; color: string }> = {
  // Images
  png: { icon: FileImage, color: 'text-green-600' },
  jpg: { icon: FileImage, color: 'text-green-600' },
  jpeg: { icon: FileImage, color: 'text-green-600' },
  gif: { icon: FileImage, color: 'text-green-600' },
  svg: { icon: FileImage, color: 'text-green-600' },
  webp: { icon: FileImage, color: 'text-green-600' },
  bmp: { icon: FileImage, color: 'text-green-600' },
  // Documents
  pdf: { icon: FileText, color: 'text-red-600' },
  doc: { icon: FileType, color: 'text-blue-600' },
  docx: { icon: FileType, color: 'text-blue-600' },
  hwp: { icon: FileType, color: 'text-sky-600' },
  hwpx: { icon: FileType, color: 'text-sky-600' },
  txt: { icon: FileText, color: 'text-gray-500' },
  rtf: { icon: FileText, color: 'text-gray-500' },
  // Spreadsheets
  xls: { icon: FileSpreadsheet, color: 'text-emerald-600' },
  xlsx: { icon: FileSpreadsheet, color: 'text-emerald-600' },
  csv: { icon: FileSpreadsheet, color: 'text-emerald-600' },
  // Presentations
  ppt: { icon: Presentation, color: 'text-orange-600' },
  pptx: { icon: Presentation, color: 'text-orange-600' },
  // Video
  mp4: { icon: FileVideo, color: 'text-purple-600' },
  avi: { icon: FileVideo, color: 'text-purple-600' },
  mov: { icon: FileVideo, color: 'text-purple-600' },
  mkv: { icon: FileVideo, color: 'text-purple-600' },
  // Audio
  mp3: { icon: FileAudio, color: 'text-pink-600' },
  wav: { icon: FileAudio, color: 'text-pink-600' },
  flac: { icon: FileAudio, color: 'text-pink-600' },
  // Archives
  zip: { icon: FileArchive, color: 'text-yellow-600' },
  rar: { icon: FileArchive, color: 'text-yellow-600' },
  '7z': { icon: FileArchive, color: 'text-yellow-600' },
  tar: { icon: FileArchive, color: 'text-yellow-600' },
  gz: { icon: FileArchive, color: 'text-yellow-600' },
  // Code
  js: { icon: FileCode, color: 'text-yellow-500' },
  ts: { icon: FileCode, color: 'text-blue-500' },
  html: { icon: FileCode, color: 'text-orange-500' },
  css: { icon: FileCode, color: 'text-blue-400' },
  json: { icon: FileCode, color: 'text-gray-500' },
}

export function FileIcon({
  fileName,
  fileExtension,
  className,
}: {
  fileName?: string
  fileExtension?: string | null
  className?: string
}) {
  const ext = (
    fileExtension || fileName?.split('.').pop() || ''
  ).toLowerCase()

  const mapping = iconMap[ext] || { icon: File, color: 'text-muted-foreground' }
  const Icon = mapping.icon

  return <Icon className={cn(mapping.color, className)} />
}
