import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const serviceClient = await createServiceClient()

      // DB에 사용자가 없으면 생성 (pending 상태)
      const email = data.user.email ?? ''
      const name =
        data.user.user_metadata?.full_name ??
        data.user.user_metadata?.name ??
        email.split('@')[0]
      const avatarUrl =
        data.user.user_metadata?.avatar_url ??
        data.user.user_metadata?.picture ??
        null

      const { data: existing } = await serviceClient
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existing) {
        // 기존 사용자: 이름/아바타 업데이트
        await serviceClient
          .from('users')
          .update({ name, avatar_url: avatarUrl })
          .eq('email', email)
      } else {
        // 신규 사용자: pending 상태로 생성
        await serviceClient.from('users').insert({
          email,
          name,
          avatar_url: avatarUrl,
          role: 'staff',
          status: 'pending',
        })
      }

      // 로그인 로그 기록
      const { data: dbUser } = await serviceClient
        .from('users')
        .select('id, name')
        .eq('email', email)
        .single()

      if (dbUser) {
        await serviceClient.from('activity_logs').insert({
          user_id: dbUser.id,
          user_email: email,
          user_name: dbUser.name,
          action: 'login',
          metadata: {
            user_agent: request.headers.get('user-agent'),
          },
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
