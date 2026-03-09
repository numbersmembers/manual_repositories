'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

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
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-lg">
            MR
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Manual Repositories
          </h1>
          <p className="text-sm text-muted-foreground">
            Bloter/Numbers 업무 매뉴얼 문서함
          </p>
        </div>
        <Button onClick={handleGoogleLogin} className="w-full" size="lg">
          Google 계정으로 로그인
        </Button>
      </div>
    </div>
  )
}
