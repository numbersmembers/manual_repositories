'use client'

import { useUser } from '@/components/user-provider'

export function Greeting() {
  const user = useUser()
  return (
    <div>
      <h2 className="text-3xl font-black tracking-tight">
        {user.name}님, 환영합니다
      </h2>
      <p className="mt-1 text-muted-foreground">
        Bloter/Numbers Docu Box
      </p>
    </div>
  )
}
