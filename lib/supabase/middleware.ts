import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth', '/pending', '/api']

function shouldSkipRedirect(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Skip redirect for public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true
  // Skip redirect for Server Action requests (POST with Next-Action header)
  if (request.headers.get('next-action')) return true
  // Skip redirect for RSC prefetch requests
  if (request.headers.get('rsc')) return true
  return false
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  try {
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
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    // Redirect to login if no session on protected routes
    if (!session && !shouldSkipRedirect(request)) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    // Never crash the middleware — just pass through
  }

  return supabaseResponse
}
