'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PendingPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const storedEmail = localStorage.getItem('mr_user_email')
    if (!storedEmail) {
      router.replace('/login')
      return
    }
    setEmail(storedEmail)

    async function checkStatus() {
      try {
        const res = await fetch(
          `/api/users/me?email=${encodeURIComponent(storedEmail!)}`
        )
        if (res.ok) {
          const user = await res.json()
          setStatus(user.status)

          if (user.status === 'active') {
            router.replace('/')
            return
          }
        } else {
          router.replace('/login')
          return
        }
      } catch {
        router.replace('/login')
        return
      } finally {
        setChecking(false)
      }
    }

    checkStatus()
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">확인 중...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Image
          src="/favicon.png"
          alt="Manual Repositories"
          width={48}
          height={48}
          className="mx-auto rounded-lg"
        />
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">승인 대기중</h1>
          <p className="text-sm text-muted-foreground">
            관리자의 승인을 기다리고 있습니다.
            <br />
            승인 후 서비스를 이용할 수 있습니다.
          </p>
        </div>
        {email && (
          <p className="text-xs text-muted-foreground">{email}</p>
        )}
        {status === 'banned' && (
          <p className="text-sm text-destructive font-medium">
            접근이 차단된 계정입니다.
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full border-2 border-black font-bold shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          >
            승인 상태 다시 확인
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              localStorage.removeItem('mr_user_email')
              router.replace('/login')
            }}
            className="w-full text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            다른 계정으로 로그인
          </Button>
        </div>
      </div>
    </div>
  )
}
