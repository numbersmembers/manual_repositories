import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import type { Document } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PAGE_SIZE = 50

type DocumentsPage = {
  documents: Document[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/** Paginated infinite-scroll document loading (for list/grid/date views) */
export function useDocumentsPaginated(
  userEmail: string,
  categoryId?: string | null
) {
  const getKey = (pageIndex: number, prev: DocumentsPage | null) => {
    if (prev && !prev.hasMore) return null
    const params = new URLSearchParams()
    params.set('user_email', userEmail)
    params.set('page', String(pageIndex + 1))
    params.set('limit', String(PAGE_SIZE))
    if (categoryId) params.set('category_id', categoryId)
    return `/api/documents?${params}`
  }

  const { data, error, size, setSize, isValidating, mutate } =
    useSWRInfinite<DocumentsPage>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    })

  const documents = data ? data.flatMap((page) => page.documents) : []
  const total = data?.[0]?.total ?? 0
  const isLoading = !data && !error
  const hasMore = data ? (data[data.length - 1]?.hasMore ?? false) : false
  const loadMore = () => setSize(size + 1)

  return { documents, total, isLoading, isValidating, hasMore, loadMore, mutate }
}

/** Load all documents via batch fetch (for folder tree view) */
export function useDocumentsAll(
  userEmail: string,
  categoryId?: string | null,
  enabled = true
) {
  const params = new URLSearchParams()
  params.set('user_email', userEmail)
  params.set('fetchAll', 'true')
  if (categoryId) params.set('category_id', categoryId)

  const { data, error, mutate } = useSWR<DocumentsPage>(
    enabled ? `/api/documents?${params}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    documents: data?.documents ?? [],
    total: data?.total ?? 0,
    isLoading: !data && !error,
    mutate,
  }
}

/** Search documents using FTS */
export function useDocumentSearch(
  query: string,
  userEmail: string,
  limit = 50
) {
  const key = query.trim()
    ? `/api/documents/search?q=${encodeURIComponent(query.trim())}&limit=${limit}&user_email=${encodeURIComponent(userEmail)}`
    : null

  const { data, error, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  })

  return {
    results: Array.isArray(data) ? data : [],
    isLoading: key !== null && !data && !error,
    mutate,
  }
}
