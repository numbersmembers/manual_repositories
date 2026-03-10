'use client'

import { usePathname } from 'next/navigation'

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-4">문제가 발생했습니다</h2>
        <p className="text-muted-foreground mb-6">
          페이지를 불러오는 중 오류가 발생했습니다.
        </p>
        <p className="text-xs text-red-500 mb-4 font-mono break-all max-w-md mx-auto">
          Page: {pathname}<br />
          {error.message}
          {error.digest ? ` (digest: ${error.digest})` : ''}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
