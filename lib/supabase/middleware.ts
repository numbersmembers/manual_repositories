import { createServerClient } from '@supabase/ssr'
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
  const publicPaths = ['/login', '/auth/callback']
  const isPublic = publicPaths.some((p) => path.startsWith(p))

  // 미인증 → 로그인으로
  if (!authUser && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 인증됨 → DB에서 사용자 상태 확인
  if (authUser && !isPublic) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('status, role')
      .eq('email', authUser.email)
      .single()

    if (dbUser?.status === 'pending' && path !== '/pending') {
      const url = request.nextUrl.clone()
      url.pathname = '/pending'
      return NextResponse.redirect(url)
    }

    if (dbUser?.status === 'banned') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/signout'
      return NextResponse.redirect(url)
    }

    if (path.startsWith('/admin') && dbUser?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // 인증된 사용자가 /login 접근 시 홈으로
  if (authUser && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
