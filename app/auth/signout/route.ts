import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()

  // 로그아웃 로그 기록
  const user = await getAuthUser()
  if (user) {
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      user_name: user.name,
      action: 'logout',
      metadata: {
        user_agent: request.headers.get('user-agent'),
      },
    })
  }

  await supabase.auth.signOut()
  return NextResponse.redirect(`${origin}/login`)
}
