'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function ClearSession() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Clear localStorage session on logout
    if (searchParams.get('cleared') === '1') {
      localStorage.removeItem('mr_user_email')
    }
  }, [searchParams])

  return null
}

function LoginError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  if (!error) return null

  return (
    <p className="text-sm text-destructive">
      로그인에 실패했습니다. 다시 시도해주세요.
    </p>
  )
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })
      if (error) {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Suspense>
        <ClearSession />
      </Suspense>
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-3">
          <Image
            src="/favicon.png"
            alt="Manual Repositories"
            width={48}
            height={48}
            className="mx-auto rounded-lg"
          />
          <h1 className="text-3xl font-black tracking-tight">
            Docu Box
          </h1>
          <p className="text-sm text-muted-foreground">
            Bloter/Numbers 비편집국 각종 문서
          </p>
        </div>
        <div className="space-y-3">
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border-2 border-black font-bold shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-100"
            size="lg"
          >
            {loading ? '로그인 중...' : 'Google 계정으로 로그인'}
          </Button>
          <Suspense>
            <LoginError />
          </Suspense>
          <p className="text-xs text-muted-foreground">
            모든 활동은 로그에 기록됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
