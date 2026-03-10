'use client'

import { Suspense, useEffect } from 'react'
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

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
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
            Manual Repositories
          </h1>
          <p className="text-sm text-muted-foreground">
            Bloter/Numbers 업무 매뉴얼 문서함
          </p>
        </div>
        <div className="space-y-3">
          <Button
            onClick={handleGoogleLogin}
            className="w-full border-2 border-black font-bold shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-100"
            size="lg"
          >
            Google 계정으로 로그인
          </Button>
          <p className="text-xs text-muted-foreground">
            모든 활동은 로그에 기록됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
