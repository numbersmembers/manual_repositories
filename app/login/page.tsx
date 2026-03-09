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
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Manual Repositories</h1>
          <p className="mt-2 text-sm text-muted-foreground">
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
