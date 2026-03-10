'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function SessionHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const email = searchParams.get('email')
    const next = searchParams.get('next') || '/'

    if (email) {
      // Store email in localStorage (immune to cookie issues on Vercel)
      localStorage.setItem('mr_user_email', email)
    }

    router.replace(next)
  }, [searchParams, router])

  return null
}

export default function SessionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">로그인 처리 중...</p>
      <Suspense>
        <SessionHandler />
      </Suspense>
    </div>
  )
}
