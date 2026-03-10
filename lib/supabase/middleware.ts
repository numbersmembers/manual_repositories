import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Record<string, string>)
          )
        },
      },
    }
  )

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const publicPaths = ['/login', '/auth/callback', '/auth/signout']
  const isPublic = publicPaths.some((p) => path.startsWith(p))

  // redirect 시 쿠키를 복사하는 헬퍼 (옵션 포함)
  function redirectWithCookies(pathname: string) {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    const redirectResponse = NextResponse.redirect(url)
    // supabaseResponse에 설정된 쿠키를 redirect 응답에 복사 (옵션 보존)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // 미인증 → 로그인으로
  if (!authUser && !isPublic) {
    return redirectWithCookies('/login')
  }

  // 인증됨 → DB에서 사용자 상태 확인 (service role로 RLS 우회)
  if (authUser && !isPublic) {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: dbUser } = await serviceClient
      .from('users')
      .select('status, role')
      .eq('email', authUser.email)
      .single()

    // DB에 사용자 레코드가 없으면 세션 정리 후 로그인으로
    if (!dbUser) {
      return redirectWithCookies('/auth/signout')
    }

    if (dbUser.status === 'pending' && path !== '/pending') {
      return redirectWithCookies('/pending')
    }

    if (dbUser.status === 'banned') {
      return redirectWithCookies('/auth/signout')
    }

    if (path.startsWith('/admin') && dbUser.role !== 'admin') {
      return redirectWithCookies('/')
    }
  }

  // 인증된 사용자가 /login 접근 시 홈으로
  if (authUser && path === '/login') {
    return redirectWithCookies('/')
  }

  return supabaseResponse
}
