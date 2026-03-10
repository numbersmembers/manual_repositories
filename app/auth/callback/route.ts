import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    // redirect 응답을 먼저 생성하고, 쿠키를 이 응답에 직접 설정
    const redirectUrl = `${requestUrl.origin}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get('cookie') ?? ''
            return cookieHeader.split(';').filter(Boolean).map((c) => {
              const [name, ...rest] = c.trim().split('=')
              return { name, value: rest.join('=') }
            })
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options as Record<string, string>)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // DB 작업은 service role로 (RLS 우회)
      const serviceClient = createServiceClient()

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
        await serviceClient
          .from('users')
          .update({ name, avatar_url: avatarUrl })
          .eq('email', email)
      } else {
        await serviceClient.from('users').insert({
          email,
          name,
          avatar_url: avatarUrl,
          role: 'staff',
          status: 'pending',
        })
      }

      // 로그인 로그
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

      return response
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
}
