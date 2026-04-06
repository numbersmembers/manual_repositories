import useSWR from 'swr'
import type { Category } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useCategories() {
  const { data, error } = useSWR<Category[]>('/api/categories', fetcher, {
    revalidateOnFocus: false,
  })

  return {
    categories: data ?? [],
    isLoading: !data && !error,
  }
}
