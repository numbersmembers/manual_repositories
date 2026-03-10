'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AuthRedirect({ to }: { to: string }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(to)
  }, [router, to])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">리다이렉트 중...</p>
    </div>
  )
}
