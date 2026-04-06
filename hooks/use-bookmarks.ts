import useSWR from 'swr'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useBookmarks(userEmail: string) {
  const { data, error, mutate } = useSWR(
    `/api/bookmarks?user_email=${encodeURIComponent(userEmail)}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const bookmarkedIds = new Set<string>(
    Array.isArray(data)
      ? data.map((bm: { document_id: string }) => bm.document_id)
      : []
  )

  const isLoading = !data && !error

  const toggleBookmark = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId, user_email: userEmail }),
      })
      if (res.ok) {
        const result = await res.json()
        toast.success(result.bookmarked ? '북마크 추가됨' : '북마크 제거됨')
        mutate()
      } else {
        toast.error('북마크 처리에 실패했습니다.')
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    }
  }

  return { bookmarkedIds, isLoading, toggleBookmark, mutate }
}
