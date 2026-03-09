import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'

export default async function PendingPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.status === 'active') redirect('/')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">승인 대기중</h1>
        <p className="text-sm text-muted-foreground">
          관리자의 승인을 기다리고 있습니다.
          <br />
          승인 후 서비스를 이용할 수 있습니다.
        </p>
        <p className="text-xs text-muted-foreground">
          {user.email}
        </p>
      </div>
    </div>
  )
}
